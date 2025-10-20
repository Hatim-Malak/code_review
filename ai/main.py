from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from langgraph.checkpoint.memory import MemorySaver
from pydantic import BaseModel,Field
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader
from dotenv import load_dotenv
from hashlib import sha256
from langgraph.graph import END,START,StateGraph
from typing import List,Literal,TypedDict
from langchain_groq import ChatGroq
from langchain_tavily import TavilySearch
from langchain_core.documents import Document
from langchain_core.messages import BaseMessage,HumanMessage,AIMessage,SystemMessage
from pinecone import Pinecone, ServerlessSpec
from langchain_core.tools import tool

from tqdm import tqdm
import sys
from itertools import islice
load_dotenv()

app = FastAPI()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV = os.getenv("PINECONE_ENV")
INDEX_NAME = "kb-index"

# Create Pinecone client
pc = Pinecone(api_key=PINECONE_API_KEY)

# Create index if not exist
if INDEX_NAME not in pc.list_indexes().names():
    pc.create_index(
        name=INDEX_NAME,
        dimension=384,  # match your embedding size
        metric='cosine',
        spec=ServerlessSpec(cloud='aws', region='us-east-1')
    )

# Connect to the index
index = pc.Index(INDEX_NAME)

# CORS setup
origins = [
    "http://localhost:5000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment setup for other APIs
os.environ["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY")
os.environ["LANGSMITH_API_KEY"] = os.getenv("LANGCHAIN_API_KEY")
os.environ["LANGSMITH_TRACING"] = "true"

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

class AIQuery(BaseModel):
    query: str
    model_name: str
    thread_id: str

@app.post("/query")
def aiBot(data:AIQuery):

    tavily = TavilySearch(max_result = 3,topic='general')

    @tool
    def web_search_tool(query:str)->str:
        """up-to-date information via tavily"""
        try:
            result = tavily.invoke({"query":query})

            if isinstance(result,dict) and 'result' in result:
                formatted_results =[]
                for item in result['results']:
                    title = item.get('title','No title')
                    content = item.get('content','No content')
                    url = item.get('url','')
                    formatted_results.append(f"title: {title} \n Content: {content} \n url: {url}")
                return "\n\n".join(formatted_results) if formatted_results else "No result found"
            else:
                return str(result)
        except Exception as e:
             print(f"error in web_search_tool {e}")
             raise HTTPException(status_code=500,detail="Internal server error" )
    
    @tool
    def rag_search_tool(query:str) ->str:
        """Top-3 chunks from kb (empty string if none)"""
        try:
            query_vector = embeddings.embed_query(query)
            result = index.query(
                vector=query_vector,
                top_k=3,
                include_metadata=True
            )
            if result and result.matches:
                return "\n\n".join(match.metadata.get("page_content", "") for match in result.matches)
        except Exception as e:
             print(f"error in web_search_tool {e}")
             raise HTTPException(status_code=500,detail="Internal server error" )

    class RouteDecision(BaseModel):
        route:Literal["rag","answer","end"]
        reply:str|None = Field(None,description="filled only when route == 'end'")

    class RagJudge(BaseModel):
        sufficient:bool    
    
    class checkLanguage(BaseModel):
        isPython:bool

    router_llm = ChatGroq(model=data.model_name).with_structured_output(RouteDecision)
    judge_llm = ChatGroq(model=data.model_name).with_structured_output(RagJudge)
    answer_llm = ChatGroq(model=data.model_name)
    language_checking_llm = ChatGroq(model=data.model_name).with_structured_output(checkLanguage)
    
    class AgentState(TypedDict,total=False):
        messages:List[BaseMessage]
        route:Literal["rag","answer","end"]
        rag:str
        web:str
        isPython:bool
    
    def language_checking_node(state:AgentState) ->AgentState:
        query = next((m.content for m in reversed(state["messages"]) if isinstance(m,HumanMessage)),"")
        messages = [
            SystemMessage(
                content=(
                    "You are a strict classifier. "
                    "Determine if the user's query is about the Python programming language. "
                    "Respond ONLY with a JSON object matching this schema:\n"
                    "{ \"isPython\": true } or { \"isPython\": false }.\n"
                    "Do not include any extra text."
                )
            ),
            HumanMessage(content=f"Check if this query is related to Python:\n{query}")
        ]

        verdict:checkLanguage = language_checking_llm.invoke(messages)

        return {
            **state,
            "isPython":verdict.isPython,
            "route":"answer" 
        }

    def router_node(state:AgentState)->AgentState:
        query = next((m.content for m in reversed(state["messages"]) if isinstance(m,HumanMessage)),"")
        message=[
            ("system",(
                """You have access to the following tools\n:
                    1. web_search_tool\n
                    2. rag_search_tool\n
                    If you need external info, use only these tools.\n
                    Do not attempt to use any other tools like 'brave_search'.\n"""
                "You are a router that decides how to handle user queries:\n"
                "- Use 'end' for pure greeting or reply that 'you are not capable enough for answering question other python programming question' \n"
                "- Use 'rag' when knowledge base lookup is needed"
                "- Use 'answer' when you can answer directly without external info"
            )),
            ("user",query)
        ]

        result:RouteDecision = router_llm.invoke(message)
        out = {'messages':state['messages'] ,"route":result.route}
        if not state.get("isPython", True):
            return {
                **state,
                "messages":state["messages"] + [AIMessage(content=result.reply or "sorry i am not capable enough to answer any other coding langauage other than python")],
                "route":"end"

            }
        if result.route == "end":
            out['messages'] = state["messages"] + [AIMessage(content=result.reply or "Hello!")]
        return out
    
    def rag_node(state:AgentState)->AgentState:
        query = next((m.content for m in reversed(state["messages"]) if isinstance(m,HumanMessage)),"")

        if state['route'] == 'rag':
            chunks = rag_search_tool(query)

        judge_message = [
            SystemMessage(content=(
                "You are a judge evaluating if the retrieved information is sufficient "
                "to answer the user's question. Consider both relevance and completeness."
            )),
            HumanMessage(content=f"Question: {query}\n\nRetrieved info: {chunks}\n\nIs this sufficient to answer the question?")
        ]
        verdict:RagJudge = judge_llm.invoke(judge_message)

        return{
            **state,
            "rag":chunks,
            "route":"answer" if verdict.sufficient else "web" 
        }
    
    def web_node(state:AgentState)->AgentState:
        query = next((m.content for m in reversed(state["messages"]) if isinstance(m,HumanMessage)),"")
        snippet = web_search_tool(query)
        return {**state,"web":snippet,"route":"answer"}
    
    def answer_node(state:AgentState) ->AgentState:
        user_q = next((m.content for m in reversed(state["messages"]) if isinstance(m,HumanMessage)),"")
        ctx_part = []

        if not state.get("isPython", True):
            return {
                **state,
                "messages": state['messages'] + [
                    AIMessage(content="Sorry, I am not capable of answering non-Python questions.")
                ]
            }

        if state.get("rag"):
            ctx_part.append("Knowledge Base information \n" + state["rag"])
        if state.get("web"):
            ctx_part.append("Web search Results: \n" + state["web"])
        context = "\n\n".join(ctx_part) if ctx_part else "No context available"
        prompt = f""" Please answer the user question using the provided context,
        Question:{user_q}
        Context:{context}
        Provide a helpful and accurate response based on the available information\n.
        Answer only Python coding questions\n.
        If the question is not a coding question or not related to Python, clearly state that you are not capable of answering\n.
        Do not provide any answer if the query is unrelated to Python.\n"""
        
        ans = answer_llm.invoke([HumanMessage(content=prompt)]).content

        return{
            **state,
            "messages":state['messages']+[AIMessage(content=ans)]
        }
    def from_router(state:AgentState) ->Literal["rag","answer","end"]:
        return state['route']
    def after_rag(state:AgentState)->Literal["rag","answer","end"]:
        return state['route']

    g = StateGraph(AgentState)
    g.add_node("check_language",language_checking_node)
    g.add_node("router",router_node)
    g.add_node("web_search",web_node)
    g.add_node("rag_lookup",rag_node)
    g.add_node("answer",answer_node)

    g.set_entry_point("check_language")
    g.add_edge("check_language","router")
    g.add_conditional_edges("router", from_router,
        {"rag": "rag_lookup", "answer": "answer", "end": END})
    g.add_conditional_edges("rag_lookup", after_rag,
            {"answer": "answer", "web": "web_search"})
    g.add_edge("web_search","answer")
    g.add_edge("answer",END)

    agent = g.compile(checkpointer=MemorySaver())
    config = {"configurable": {"thread_id": str(data.thread_id)}}
    result = agent.invoke({"messages": [HumanMessage(content=data.query)]}, config)
    return {"response": result["messages"][-1].content}
