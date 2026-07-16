from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from pydantic import BaseModel, Field
from langchain_huggingface import HuggingFaceEndpointEmbeddings
from dotenv import load_dotenv
from langgraph.graph import END, START, StateGraph
from sentence_transformers import CrossEncoder
from typing import Literal, List, Dict, Any
from langchain_groq import ChatGroq
from langchain_tavily import TavilySearch
from langchain_core.messages import HumanMessage, SystemMessage
from pinecone import Pinecone, ServerlessSpec
from langchain_core.tools import tool
from langchain_core.prompts import ChatPromptTemplate
from typing_extensions import TypedDict
from langchain_core.output_parsers import StrOutputParser
import re
from ingestion import ingest_repo_files,reindex_repo_files

load_dotenv()

app = FastAPI()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
INDEX_NAME = "kb-index"
pc = Pinecone(api_key=PINECONE_API_KEY)

print("[rag_init] Loading Cross-Encoder reranker model...")
reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

if INDEX_NAME not in pc.list_indexes().names():
    pc.create_index(
        name=INDEX_NAME,
        dimension=1024,
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

if os.getenv("GROQ_API_KEY"):
    os.environ["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY")

embeddings = HuggingFaceEndpointEmbeddings(
    model="BAAI/bge-m3",
    task="feature-extraction",
    huggingfacehub_api_token=os.getenv("HF_TOKEN")
)
tavily = TavilySearch(max_results=3, topic='general')


class AIQuery(BaseModel):
    query: str
    model_name: str
    context: list[str]
    thread_id: str


class RouteDecision(BaseModel):
    route: Literal["rag", "answer", "end"] = Field(
        ...,
        description="The single best route for this query, chosen strictly per the rules given in the system prompt. Must be exactly one of: rag, answer, end."
    )
    reply: str | None = Field(
        None,
        description="A short, direct reply string. Required (non-empty) only when route='end'. Must be null for route='rag' or route='answer'."
    )


class RagJudge(BaseModel):
    sufficient: bool = Field(
        ...,
        description="True only if the retrieved text, taken alone and with no outside knowledge, fully and directly answers the question. False if the retrieved text is empty, off-topic, partial, or ambiguous."
    )


class CheckLanguage(BaseModel):
    isPython: bool = Field(
        ...,
        description="True if the query concerns the Python language, its standard library, or a Python-ecosystem framework/tool (e.g. Django, FastAPI, Pandas, NumPy). False for greetings, small talk, or topics unrelated to Python."
    )


class MultiQueries(BaseModel):
    queries: list[str] = Field(
        ...,
        description="Exactly 3 short alternative phrasings of the original query, each using different technical terms or synonyms a codebase/docs search might use. Do not repeat the original query and do not answer it."
    )


class AgentState(TypedDict, total=False):
    query: str
    route: Literal["rag", "answer", "end"]
    conversational_summary: str
    rag: str
    web: str
    isPython: bool
    result: str
    rag_sources: list[str]
    context_str: str


GROUNDING_RULE = (
    "Never invent facts, APIs, function or class names, parameters, or numbers that are not present "
    "in the given context or in verified, well-established Python knowledge. If you are not certain, "
    "say so explicitly instead of guessing."
)


def _safe_structured_invoke(llm, messages, fallback, node_name: str = "llm_call"):
    """Invokes a structured-output LLM call and falls back safely if parsing fails."""
    try:
        return llm.invoke(messages)
    except Exception as e:
        print(f"[{node_name}_warning] structured output failed, using fallback: {e}")
        return fallback


multiquery_llm = ChatGroq(model="openai/gpt-oss-20b", temperature=0.3).with_structured_output(MultiQueries)


def _generate_multi_queries(query: str) -> list[str]:
    """Generates alternative phrasings of the query to improve semantic recall."""
    messages = [
        SystemMessage(content=(
            "You are a query-expansion assistant for a technical codebase/documentation search tool. "
            "Given a user query, produce exactly 3 alternative phrasings that use different technical "
            "terms or synonyms a developer or the documentation might use, while preserving the original "
            "meaning. Do not answer the query and do not add details it does not imply."
        )),
        HumanMessage(content=f"Query: {query}")
    ]
    fallback = MultiQueries(queries=[])
    result = _safe_structured_invoke(multiquery_llm, messages, fallback, "multiquery")
    return list(dict.fromkeys([query] + result.queries))


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


def _rag_candidates(query: str, source_filter: str = None, namespace: str = None) -> Dict[str, Dict[str, Any]]:
    """Multi-query expansion + Pinecone retrieval, before reranking. Shared by
    the chat RAG path and the repo-review path so both benefit from the same
    query expansion and de-duplication logic."""
    expanded_queries = _generate_multi_queries(query)
    candidate_pool: Dict[str, Dict[str, Any]] = {}

    filter_expression = {}
    if source_filter:
        filter_expression["source"] = {"$eq": source_filter}

    for q in expanded_queries:
        query_vector = embeddings.embed_query(q)

        result = index.query(
            vector=query_vector,
            top_k=20,
            include_metadata=True,
            filter=filter_expression if filter_expression else None,
            namespace=namespace or "",
        )
        if result and result.matches:
            for match in result.matches:
                if match.id not in candidate_pool:
                    candidate_pool[match.id] = {
                        "id": match.id,
                        "text": match.metadata.get("text", ""),
                        "code_solution": match.metadata.get("code_solution", ""),
                        "source": match.metadata.get("source", "Unknown Source"),
                        "file_path": match.metadata.get("file_path", ""),
                        "token_count": match.metadata.get("token_count", 0),
                        "chunk_index": match.metadata.get("chunk_index", 0),
                    }
    return candidate_pool


def _rerank(query: str, candidates: list[dict], top_n: int = 3) -> list[dict]:
    if not candidates:
        return []
    rerank_pairs = [[query, item["text"]] for item in candidates]
    scores = reranker.predict(rerank_pairs)
    for idx, score in enumerate(scores):
        candidates[idx]["rerank_score"] = float(score)
    candidates.sort(key=lambda x: x["rerank_score"], reverse=True)
    return candidates[:top_n]


def rag_search_tool(query: str, source_filter: str = None, namespace: str = None) -> list:
    """Advanced RAG pipeline featuring Multi-Query expansion, metadata filtering, and Cross-Encoder reranking."""
    try:
        candidate_pool = _rag_candidates(query, source_filter=source_filter, namespace=namespace)
        if not candidate_pool:
            return []

        elite_chunks = _rerank(query, list(candidate_pool.values()), top_n=3)
        return [
            {
                "content": f"Context:\n{chunk['text']}\n\nSolution/Code:\n{chunk['code_solution']}",
                "source": chunk["source"],
                "metadata": {
                    "chunk_index": chunk["chunk_index"],
                    "token_count": chunk["token_count"],
                    "relevance_score": chunk["rerank_score"],
                },
            }
            for chunk in elite_chunks
        ]
    except Exception as e:
        print(f"error in rag_search_tool {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


def build_agent_graph(model_name: str):
    """
    Initializes LLMs and compiles the LangGraph based on the requested model.
    """
    router_llm = ChatGroq(model=model_name, temperature=0).with_structured_output(RouteDecision)
    judge_llm = ChatGroq(model=model_name, temperature=0).with_structured_output(RagJudge)
    answer_llm = ChatGroq(model=model_name, temperature=0.2, max_tokens=1024)
    language_checking_llm = ChatGroq(model=model_name, temperature=0).with_structured_output(CheckLanguage)
    fast_llm = ChatGroq(model="openai/gpt-oss-20b", temperature=0)

    def language_checking_node(state: AgentState) -> AgentState:
        history_block = (
            f"\n\nConversation history (use ONLY to disambiguate a short, ambiguous follow-up; "
            f"never use it to justify a clearly new, unrelated topic):\n{state['conversational_summary']}"
            if state.get("conversational_summary") else ""
        )
        messages = [
            SystemMessage(content=(
                "You are a strict binary classifier for a Python-only coding assistant.\n"
                "Decide whether the CURRENT query is something a Python coding assistant should answer: "
                "it concerns the Python programming language, its standard library, or a Python-ecosystem "
                "framework/tool (e.g. Django, FastAPI, Pandas, NumPy, pytest) — OR it is a short, "
                "self-incomplete follow-up (e.g. 'what about for CSV files?', 'can you show an example?') "
                "that only makes sense in light of a prior Python discussion in the history.\n\n"
                "If the current query introduces a new, self-contained topic unrelated to Python or "
                "programming (general knowledge, geography, history, small talk, etc.), it is isPython: "
                "false — even if the conversation history was about Python. Earlier Python discussion "
                "never makes an unrelated new question Python-related.\n\n"
                "Examples:\n"
                "- History about pandas CSV parsing; query 'what about excel files?' -> true (follow-up)\n"
                "- History about pandas CSV parsing; query 'do you know about the Himalayas?' -> false (new, unrelated topic)\n"
                "- No history; query 'hello' -> false\n"
                "- No history; query 'how do I reverse a list?' -> true"
            )),
            HumanMessage(content=f"Current query: {state['query']}{history_block}")
        ]
        fallback = CheckLanguage(isPython=True)
        verdict = _safe_structured_invoke(language_checking_llm, messages, fallback, "language_check")
        return {"isPython": verdict.isPython, "route": "answer"}

    def router_node(state: AgentState) -> AgentState:
        if not state.get("isPython", True):
            return {"result": "Sorry, I only answer Python questions.", "route": "end"}

        messages = [
            SystemMessage(content=(
                "You are the routing agent for a Python-only AI assistant. The query has already been "
                "confirmed to be Python-related — do not re-evaluate that. Choose exactly ONE route:\n\n"
                "- 'rag' (default/primary): any 'how to' request, debugging help, library usage "
                "(Pandas, Django, FastAPI, etc.), project structure, or code generation. If uncertain, "
                "choose 'rag'.\n"
                "- 'answer': ONLY for basic conceptual definitions needing no code at all "
                "(e.g. 'what is a variable?', 'define OOP').\n"
                "- 'end': ONLY for pure pleasantries ('hello', 'thanks'). Must include a short 'reply'.\n\n"
                "Set 'reply' to null unless route is 'end'. Do not add any field beyond route and reply."
            )),
            HumanMessage(content=state["query"])
        ]
        fallback = RouteDecision(route="rag", reply=None)
        result = _safe_structured_invoke(router_llm, messages, fallback, "router")

        if result.route == "end":
            return {"route": "end", "result": result.reply or "Hello!"}
        return {"route": result.route, "result": ""}

    def rag_node(state: AgentState) -> AgentState:
        docs = rag_search_tool(state["query"]) if state['route'] == 'rag' else []
        chunks_str = "\n\n".join([d["content"] for d in docs]) if docs else ""
        sources = list(set([d["source"] for d in docs])) if docs else []

        if not chunks_str:
            return {"rag": "", "rag_sources": [], "route": "web"}

        judge_message = [
            SystemMessage(content=(
                "You are a strict, evidence-only judge. Decide whether the 'Retrieved info' below — and "
                "ONLY that text — is enough to fully and accurately answer the question. Do not use "
                "outside knowledge and do not fill in missing details yourself. If the retrieved info is "
                "partial, tangential, or ambiguous, mark it insufficient."
            )),
            HumanMessage(content=f"Question: {state['query']}\n\nRetrieved info:\n{chunks_str}")
        ]
        fallback = RagJudge(sufficient=False)
        verdict = _safe_structured_invoke(judge_llm, judge_message, fallback, "judge")

        return {
            "rag": chunks_str,
            "rag_sources": sources,
            "route": "answer" if verdict.sufficient else "web"
        }

    def web_node(state: AgentState) -> AgentState:
        snippet = web_search_tool(state["query"])
        return {"web": snippet, "route": "answer"}

    def summarizeHistory(state: AgentState) -> AgentState:
        ctx = state.get("context_str", "")
        if not ctx:
            return {"conversational_summary": ""}

        try:
            if len(ctx) < 400000:
                system_prompt = (
                    "You compress a chat history into a factual briefing for another AI assistant that "
                    "will continue the conversation. Extract only what is needed to continue correctly:\n"
                    "- The user's primary problem or goal\n"
                    "- Any solution, code, or approach already given\n"
                    "- Constraints, preferences, or corrections the user stated\n"
                    "Use short bullet points. Do not add opinions, conclusions, or any detail that was "
                    "not actually present in the conversation."
                )
            else:
                system_prompt = (
                    "You compress a long chat history into the smallest possible factual briefing. "
                    "Output ONLY the final architectural/technical conclusions reached, as plain "
                    "statements grounded in the conversation. Maximum 4 sentences. No preamble, no "
                    "filler, nothing that wasn't actually stated."
                )

            summary_prompt = ChatPromptTemplate.from_messages([
                ("system", system_prompt),
                ("human", "Conversation history:\n\n{conversation}")
            ])
            summarize_chain = summary_prompt | fast_llm | StrOutputParser()
            summary = summarize_chain.invoke({"conversation": ctx})
            return {"conversational_summary": summary}
        except Exception as e:
            print(f"[summarize_warning] {e}")
            return {"conversational_summary": ""}

    def answer_node(state: AgentState) -> AgentState:
        if not state.get("isPython", True):
            return {"result": "Sorry, I only answer Python questions."}

        ctx_part = []
        if state.get("rag"):
            ctx_part.append("Knowledge Base:\n" + state["rag"])
        if state.get("web"):
            ctx_part.append("Web Results:\n" + state["web"])
        if state.get("conversational_summary"):
            ctx_part.append("Prior Conversation:\n" + state["conversational_summary"])
        context = "\n\n".join(ctx_part) if ctx_part else "No supporting context was retrieved."

        messages = [
            SystemMessage(content=(
                "You are a precise Python coding assistant. Only answer questions about Python, its "
                "standard library, or Python-ecosystem frameworks/tools. If the question is clearly about "
                "an unrelated topic (general knowledge, geography, history, etc.), reply exactly: "
                "\"Sorry, I only answer Python questions.\" and nothing else — regardless of what the "
                "provided context contains. Otherwise, prefer the provided context when it is relevant. "
                f"{GROUNDING_RULE} If the context is missing or insufficient, answer from well-established "
                "Python knowledge only, and say so if you're not fully certain."
            )),
            HumanMessage(content=f"Question: {state['query']}\n\nContext:\n{context}")
        ]
        ans = answer_llm.invoke(messages).content
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

    g.add_conditional_edges(START, check_summary_needed, {"No": "check_language", "Yes": "summarize"})
    g.add_edge("summarize", "check_language")
    g.add_edge("check_language", "router")
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

    return {"response": result.get("result", "An error occurred."),
            "rag_sources": result.get("rag_sources", [])
            }

class RepoFile(BaseModel):
    path: str
    content: str


class IndexRequest(BaseModel):
    namespace: str
    repo_full_name: str
    files: list[RepoFile]


class ReindexRequest(IndexRequest):
    removed_paths: list[str] = []


class DiffFile(BaseModel):
    filename: str
    patch: str | None = None
    status: str | None = None


class ReviewRequest(BaseModel):
    namespace: str
    repo_full_name: str
    files: list[DiffFile]
    model_name: str = "llama-3.1-8b-instant"


class ReviewFinding(BaseModel):
    file: str
    startLine: int
    endLine: int
    severity: Literal["info", "warning", "error"]
    comment: str
    suggestedFix: str | None = None
    hunkText: str | None = None


class ReviewResult(BaseModel):
    findings: list[ReviewFinding]
    rag_sources: list[str]


class HunkReview(BaseModel):
    has_issue: bool = Field(
        ...,
        description="True only if this hunk has a genuine, specific problem worth flagging — a bug, "
                    "security issue, or a clear deviation from the patterns shown in context. False for "
                    "clean, unremarkable changes; do not invent issues to have something to say."
    )
    severity: Literal["info", "warning", "error"] = Field(
        default="info",
        description=(
            "Base this ONLY on CONSEQUENCE if the issue is real:\n"
            "'error' — would break functionality, corrupt data, crash the app, or introduce a security "
            "hole if this code runs as written.\n"
            "'warning' — works today but is risky: touches how a critical data record is constructed or "
            "written (database writes, IDs, status fields consumed elsewhere), or deviates from an "
            "established pattern.\n"
            "'info' — purely cosmetic: naming, formatting, comments, minor style.\n"
            "DO NOT scale severity based on uncertainty. If you are uncertain about a data-correctness issue, "
            "do not lower it to 'info' — an unconfirmed data issue is worse than a confirmed style nit."
        ),
    )
    comment: str = Field(
        default="",
        description="A short, specific explanation grounded in the given context. Empty if has_issue is False."
    )
    suggested_fix: str | None = Field(
        None, description="A brief concrete fix suggestion, or null if none applies."
    )

HUNK_HEADER_RE = re.compile(r"^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@")


def _split_patch_into_hunks(patch: str) -> list[dict]:
    if not patch:
        return []

    hunks = []
    current_lines: list[str] = []
    current_start = None
    current_len = 1

    for line in patch.splitlines():
        match = HUNK_HEADER_RE.match(line)
        if match:
            if current_start is not None:
                hunks.append({
                    "text": "\n".join(current_lines),
                    "start_line": current_start,
                    "end_line": current_start + current_len - 1,
                })
            current_lines = [line]
            current_start = int(match.group(1))
            current_len = int(match.group(2) or 1)
        else:
            current_lines.append(line)

    if current_start is not None:
        hunks.append({
            "text": "\n".join(current_lines),
            "start_line": current_start,
            "end_line": current_start + current_len - 1,
        })

    return hunks

@app.post("/index")
def index_repo(data: IndexRequest):
    try:
        files = [f.dict() for f in data.files]
        count = ingest_repo_files(data.repo_full_name, data.namespace, files, index, embeddings.embed_documents)
        return {"indexed": count}
    except Exception as e:
        print(f"error in /index {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/reindex")
def reindex_repo(data: ReindexRequest):
    try:
        files = [f.dict() for f in data.files]
        count = reindex_repo_files(
            data.repo_full_name, data.namespace, files, data.removed_paths,
            index, embeddings.embed_documents,
        )
        return {"reindexed": count, "removed": len(data.removed_paths)}
    except Exception as e:
        print(f"error in /reindex {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    
review_llm_cache: dict[str, Any] = {}


def get_review_llm(model_name: str):
    if model_name not in review_llm_cache:
        review_llm_cache[model_name] = ChatGroq(model=model_name, temperature=0).with_structured_output(HunkReview)
    return review_llm_cache[model_name]

IMPORT_RE = re.compile(r"^[+-]\s*(import|from)\s")
COMMENT_OR_BLANK_RE = re.compile(r"^[+-]\s*(#.*)?$")

def _is_trivial_hunk(hunk_text: str) -> bool:
    changed = [l for l in hunk_text.splitlines() if l.startswith(("+", "-")) and not l.startswith(("+++", "---"))]
    if not changed:
        return True
    meaningful = [l for l in changed if not COMMENT_OR_BLANK_RE.match(l) and not IMPORT_RE.match(l)]
    return len(meaningful) == 0

def _review_rag_search(query: str, repo_namespace: str) -> list[dict]:
    """Single embedding call instead of multi-query expansion — a diff hunk
    is already specific text, unlike a short ambiguous chat question, so
    paraphrasing it into 3 variants buys little recall for real token cost."""
    query_vector = embeddings.embed_query(query)  # zero LLM calls
        
    candidate_pool: Dict[str, Dict[str, Any]] = {}
    for ns in (repo_namespace, None):
        result = index.query(vector=query_vector, top_k=20, include_metadata=True, namespace=ns or "")
        if result and result.matches:
            for match in result.matches:
                if match.id not in candidate_pool:
                    candidate_pool[match.id] = {
                        "id": match.id,
                        "text": match.metadata.get("text", ""),
                        "code_solution": match.metadata.get("code_solution", ""),
                        "source": match.metadata.get("source", "Unknown Source"),
                        "file_path": match.metadata.get("file_path", ""),
                        "token_count": match.metadata.get("token_count", 0),
                        "chunk_index": match.metadata.get("chunk_index", 0),
                    }
    return _rerank(query, list(candidate_pool.values()), top_n=3)


def _review_hunk(model_name: str, filename: str, hunk_text: str, context_chunks: list[dict]) -> HunkReview:
    context_str = "\n\n".join(
        f"[{c.get('file_path') or c['source']}] {c['text']}" for c in context_chunks
    ) if context_chunks else "No related context was retrieved."

    messages = [
        SystemMessage(content=(
            "You are a precise, conservative code reviewer. You are given one hunk (a contiguous block "
            "of changes) from a pull request diff, plus retrieved context from the project's own codebase "
            "and general best-practice knowledge. Flag an issue ONLY if it is specific and grounded in the "
            f"diff or the given context — never invent a problem to have something to say. {GROUNDING_RULE}\n"
            "If you are not confident the issue is real, or you are just hedging your bets, set has_issue to False."
        )),
        HumanMessage(content=f"File: {filename}\n\nDiff hunk:\n{hunk_text}\n\nRetrieved context:\n{context_str}")
    ]
    fallback = HunkReview(has_issue=False, severity="info", comment="")
    return _safe_structured_invoke(get_review_llm(model_name), messages, fallback, "hunk_review")


MAX_HUNKS_PER_REVIEW = 40


@app.post("/review", response_model=ReviewResult)
def review_pr(data: ReviewRequest):
    all_findings: list[ReviewFinding] = []
    all_sources: set[str] = set()
    hunks_processed = 0

    for file in data.files:
        if hunks_processed >= MAX_HUNKS_PER_REVIEW:
            break
        for hunk in _split_patch_into_hunks(file.patch):
            if hunks_processed >= MAX_HUNKS_PER_REVIEW:
                break
            if _is_trivial_hunk(hunk["text"]):
                continue
            hunks_processed += 1

            query = f"Review this change in {file.filename}:\n{hunk['text']}"
            context_chunks = _review_rag_search(query, repo_namespace=data.namespace)
            review = _review_hunk(data.model_name, file.filename, hunk["text"], context_chunks)

            if not review.has_issue:
                continue

            all_findings.append(ReviewFinding(
                file=file.filename,
                startLine=hunk["start_line"],
                endLine=hunk["end_line"],
                severity=review.severity,
                comment=review.comment,
                suggestedFix=review.suggested_fix,
                hunkText=hunk["text"],
            ))
            all_sources.update(c.get("file_path") or c["source"] for c in context_chunks)

    return ReviewResult(findings=all_findings, rag_sources=list(all_sources))