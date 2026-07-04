from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from pydantic import BaseModel, Field
from langchain_huggingface import HuggingFaceEmbeddings
from dotenv import load_dotenv
from langgraph.graph import END, START, StateGraph
from typing import Literal
from langchain_groq import ChatGroq
from langchain_tavily import TavilySearch
from langchain_core.messages import HumanMessage, SystemMessage
from pinecone import Pinecone, ServerlessSpec
from langchain_core.tools import tool
from langchain_core.prompts import ChatPromptTemplate
from typing_extensions import TypedDict
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

app = FastAPI()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
INDEX_NAME = "kb-index"
pc = Pinecone(api_key=PINECONE_API_KEY)

if INDEX_NAME not in pc.list_indexes().names():
    pc.create_index(
        name=INDEX_NAME,
        dimension=384,
        metric='cosine',
        spec=ServerlessSpec(cloud='aws', region='us-east-1')
    )
index = pc.Index(INDEX_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.environ["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY")
os.environ["LANGSMITH_API_KEY"] = os.getenv("LANGCHAIN_API_KEY")
os.environ["LANGSMITH_TRACING"] = "true"

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
tavily = TavilySearch(max_result=3, topic='general')

class AIQuery(BaseModel):
    query: str
    model_name: str
    context: list[str]
    thread_id: str

class RouteDecision(BaseModel):
    route: Literal["rag", "answer", "end"]
    reply: str | None = Field(None, description="filled only when route == 'end'")

class RagJudge(BaseModel):
    sufficient: bool    
    
class CheckLanguage(BaseModel):
    isPython: bool

class AgentState(TypedDict, total=False):
    query: str
    route: Literal["rag", "answer", "end"]
    conversational_summary: str
    rag: str
    web: str
    isPython: bool
    result: str
    context_str: str  

def web_search_tool(query: str) -> str:
    """up-to-date information via tavily"""
    try:
        result = tavily.invoke({"query": query})
        if isinstance(result, dict) and 'results' in result:
            formatted_results = [
                f"title: {item.get('title', 'No title')} \n Content: {item.get('content', 'No content')} \n url: {item.get('url', '')}" 
                for item in result['results']
            ]
            return "\n\n".join(formatted_results) if formatted_results else "No result found"
        return str(result)
    except Exception as e:
        print(f"error in web_search_tool {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    

def rag_search_tool(query: str) -> str:
    """Top-3 chunks from kb"""
    try:
        query_vector = embeddings.embed_query(query)
        result = index.query(
            vector=query_vector,
            top_k=3,
            include_metadata=True
        )
        if result and result.matches:
            return "\n\n".join(match.metadata.get("page_content", "") for match in result.matches)
        return ""
    except Exception as e:
        print(f"error in rag_search_tool {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


def build_agent_graph(model_name: str):
    """
    Initializes LLMs and compiles the LangGraph based on the requested model.
    """
    router_llm = ChatGroq(model=model_name).with_structured_output(RouteDecision)
    judge_llm = ChatGroq(model=model_name).with_structured_output(RagJudge)
    answer_llm = ChatGroq(model=model_name)
    language_checking_llm = ChatGroq(model=model_name).with_structured_output(CheckLanguage)
    fast_llm = ChatGroq(model="llama-3.1-8b-instant")
    
    def language_checking_node(state: AgentState) -> AgentState:
        messages = [
            SystemMessage(content=("You are a strict classifier. Determine if the user's query is about Python. "
                                   "Respond ONLY with JSON: { \"isPython\": true } or { \"isPython\": false }.")),
            HumanMessage(content=f"Check if this query is related to Python:\n{state['query']}")
        ]
        verdict = language_checking_llm.invoke(messages)
        return {"isPython": verdict.isPython, "route": "answer"}

    def router_node(state: AgentState) -> AgentState:
        message = [
            ("system", (
                "You have access to tools: web_search_tool, rag_search_tool.\n"
                "You are a router that decides how to handle user queries:\n"
                "- Use 'end' for pure greeting or non-python questions.\n"
                "- Use 'rag' when knowledge base lookup is needed.\n"
                "- Use 'answer' when you can answer directly.\n"
            )),
            ("user", state["query"])
        ]
        result = router_llm.invoke(message)
        out = {"result": "", "route": result.route}
        
        if not state.get("isPython", True):
            return {"result": result.reply or "Sorry, I only answer Python questions.", "route": "end"}
        
        if result.route == "end":
            out["result"] = result.reply or "Hello!"
        return out
    
    def rag_node(state: AgentState) -> AgentState:
        chunks = rag_search_tool(state["query"]) if state['route'] == 'rag' else ""
        judge_message = [
            SystemMessage(content="You are a judge evaluating if the retrieved information is sufficient."),
            HumanMessage(content=f"Question: {state['query']}\n\nRetrieved info: {chunks}\n\nIs this sufficient?")
        ]
        verdict = judge_llm.invoke(judge_message)
        return {"rag": chunks, "route": "answer" if verdict.sufficient else "web"}
    
    def web_node(state: AgentState) -> AgentState:
        snippet = web_search_tool(state["query"])
        return {"web": snippet, "route": "answer"}
    
    def summarizeHistory(state: AgentState) -> AgentState:
        ctx = state.get("context_str", "")
        if not ctx:
            return {"conversational_summary": ""}
            
        try:
            if len(ctx) < 400000:
                prompt = [
                    ("system", "Extract primary problem, solution, constraints. Use bullets. Remove filler."),
                    ("human", "Summarize:\n\n{conversation}")
                ]
            else:
                prompt = [
                    ("system", "Maximum compression. Output ONLY architectural conclusions. Max 4 sentences."),
                    ("human", "Compress:\n\n{conversation}")
                ]
            
            summary_prompt = ChatPromptTemplate.from_messages(prompt)
            summarize_chain = summary_prompt | fast_llm | StrOutputParser()
            summary = summarize_chain.invoke({"conversation": ctx})
            return {"conversational_summary": summary} 
        except Exception as e:
            print(f"Error in summarizeHistory: {e}")
            return {"conversational_summary": ""} 
    
    def answer_node(state: AgentState) -> AgentState:
        ctx_part = []
        if not state.get("isPython", True):
            return {"result": "Sorry, I only answer Python questions."}

        if state.get("rag"): ctx_part.append("Knowledge Base: \n" + state["rag"])
        if state.get("web"): ctx_part.append("Web Results: \n" + state["web"])
        if state.get("conversational_summary"): ctx_part.append("History: \n" + state["conversational_summary"])
        
        context = "\n\n".join(ctx_part) if ctx_part else "No context available"
        prompt = f"Answer using context.\nQuestion:{state['query']}\nContext:{context}\nAnswer ONLY Python questions."
        
        ans = answer_llm.invoke([HumanMessage(content=prompt)]).content
        return {"result": ans}

    def check_summary_needed(state: AgentState) -> Literal["Yes", "No"]:
        return "Yes" if state.get("context_str") else "No"

    g = StateGraph(AgentState)
    g.add_node("check_language", language_checking_node)
    g.add_node("router", router_node)
    g.add_node("web_search", web_node)
    g.add_node("rag_lookup", rag_node)
    g.add_node("answer", answer_node)
    g.add_node("summarize", summarizeHistory)

    g.add_edge(START, "check_language")
    g.add_conditional_edges("check_language", check_summary_needed, {"No": "router", "Yes": "summarize"})
    g.add_edge("summarize", "router")
    g.add_conditional_edges("router", lambda s: s['route'], {"rag": "rag_lookup", "answer": "answer", "end": END})
    g.add_conditional_edges("rag_lookup", lambda s: s['route'], {"answer": "answer", "web": "web_search"})
    g.add_edge("web_search", "answer")
    g.add_edge("answer", END)

    return g.compile()


agent_cache = {}

def get_cached_agent(model_name: str):
    if model_name not in agent_cache:
        print(f"Compiling graph for model: {model_name}...")
        agent_cache[model_name] = build_agent_graph(model_name)
    return agent_cache[model_name]

@app.post("/query")
def aiBot(data: AIQuery):
    agent = get_cached_agent(data.model_name)
    
    joined_context = "\n".join(data.context) if data.context else ""
    
    initial_state = {
        "query": data.query,
        "context_str": joined_context
    }
    
    result = agent.invoke(initial_state)
    
    return {"response": result.get("result", "An error occurred.")}