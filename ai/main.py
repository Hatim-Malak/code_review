from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from logger import logger
import httpx
from fastapi.middleware.cors import CORSMiddleware
import os
from pydantic import BaseModel, Field
from langchain_huggingface import HuggingFaceEndpointEmbeddings
from dotenv import load_dotenv
import time
from langgraph.graph import END, START, StateGraph
from typing import Literal, List, Dict, Any
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from pinecone import Pinecone, ServerlessSpec
from langchain_core.tools import tool
from langchain_core.prompts import ChatPromptTemplate
from typing_extensions import TypedDict
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser
import re
from ingestion import ingest_repo_files,reindex_repo_files
import uvicorn

load_dotenv()

app = FastAPI()

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    formatted_process_time = "{0:.2f}".format(process_time)
    logger.info(f"{request.method} {request.url.path} {response.status_code} - {formatted_process_time}ms")
    return response


PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
INDEX_NAME = "kb-index"
pc = Pinecone(api_key=PINECONE_API_KEY)

logger.info("[rag_init] Cross-Encoder reranking will use Hugging Face API.")

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
    allow_origins=["*"],
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


def _embed_with_retry(func, *args, retries=5, backoff=2, **kwargs):
    for attempt in range(retries):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            if attempt == retries - 1:
                raise e
            logger.info(f"Embedding failed (Rate limit?), sleeping {backoff}s... (Attempt {attempt+1}/{retries})")
            time.sleep(backoff)
            backoff *= 2

class AIQuery(BaseModel):
    query: str
    model_name: str
    context: list[str]
    thread_id: str
    namespace: str
    repo_full_name: str


class RouteDecision(BaseModel):
    route: Literal["rag", "answer", "end"] = Field(
        ...,
        description="The single best route for this query, chosen strictly per the rules given in the system prompt. Must be exactly one of: rag, answer, end."
    )
    reply: str | None = Field(
        None,
        description="A short, direct reply string. Required (non-empty) only when route='end'. Must be null for route='rag' or route='answer'."
    )


class CheckRepoRelevance(BaseModel):
    isRepoRelated: bool = Field(
        ...,
        description=(
            "True if the query is about the user's codebase, repository, code structure, "
            "bugs, features, architecture, dependencies, or is a follow-up to a prior "
            "codebase discussion. False for general programming tutorials, unrelated topics, "
            "or questions that have nothing to do with the repository."
        )
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
    isRepoRelated: bool
    result: str
    rag_sources: list[str]
    context_str: str
    namespace: str
    repo_full_name: str


GROUNDING_RULE = (
    "Never invent facts, APIs, function or class names, parameters, or numbers that are not present "
    "in the given context. If you are not certain, say so explicitly instead of guessing."
)


def _safe_structured_invoke(llm, messages, fallback, node_name: str = "llm_call", retries: int = 2):
    """Invokes a structured-output LLM call with retries, and falls back safely if all attempts fail."""
    for attempt in range(retries):
        try:
            return llm.invoke(messages)
        except Exception as e:
            logger.warning(f"[{node_name}_warning] structured output attempt {attempt + 1}/{retries} failed: {e}")
    logger.warning(f"[{node_name}_warning] all {retries} attempts failed, using fallback")
    return fallback

multiquery_llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.3).with_structured_output(MultiQueries)


def _generate_multi_queries(query: str) -> list[str]:
    """Generates alternative phrasings of the query to improve semantic recall."""
    messages = [
        SystemMessage(content=(
            "You are a query-expansion assistant for a technical codebase/documentation search tool. "
            "Given a user query, produce exactly 3 alternative phrasings that use different technical "
            "terms or synonyms a developer or the documentation might use, while preserving the original "
            "meaning. Do not answer the query and do not add details it does not imply.\n"
            "CRITICAL: You MUST call the provided function to structure your output. Do not respond with plain text."
        )),
        HumanMessage(content=f"Query: {query}")
    ]
    fallback = MultiQueries(queries=[])
    result = _safe_structured_invoke(multiquery_llm, messages, fallback, "multiquery")
    return list(dict.fromkeys([query] + result.queries))


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
    try:
        results = pc.inference.rerank(
            model="bge-reranker-v2-m3",
            query=query,
            documents=[item["text"] for item in candidates],
            top_n=len(candidates),  # score everything, we trim to top_n ourselves below
            return_documents=False,
            parameters={"truncate": "END"}
        )
        for r in results.data:
            candidates[r.index]["rerank_score"] = r.score
    except Exception as e:
        logger.error(f"[rerank_error] Pinecone rerank failed: {e}")
        for idx in range(len(candidates)):
            candidates[idx]["rerank_score"] = 0.0

    candidates.sort(key=lambda x: x.get("rerank_score", 0.0), reverse=True)
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
        logger.error(f"error in rag_search_tool {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


def build_agent_graph(model_name: str):
    """
    Initializes LLMs and compiles the LangGraph based on the requested model.
    """
    router_llm = ChatGroq(model=model_name, temperature=0).with_structured_output(RouteDecision)
    answer_llm = ChatGroq(model=model_name, temperature=0.2, max_tokens=1024)
    relevance_checking_llm = ChatGroq(model=model_name, temperature=0).with_structured_output(CheckRepoRelevance)
    fast_llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)

    def relevance_checking_node(state: AgentState) -> AgentState:
        history_block = (
            f"\n\nConversation history (use ONLY to disambiguate a short, ambiguous follow-up; "
            f"never use it to justify a clearly new, unrelated topic):\n{state['conversational_summary']}"
            if state.get("conversational_summary") else ""
        )
        repo_name = state.get("repo_full_name", "unknown")
        messages = [
            SystemMessage(content=(
                f"You are a strict binary classifier for a codebase assistant scoped to the repository '{repo_name}'.\n"
                "Decide whether the CURRENT query is something this assistant should answer: "
                "it asks about the repository's code, architecture, bugs, dependencies, deployment, "
                "testing, or any technical aspect of this specific codebase — OR it is a short, "
                "self-incomplete follow-up (e.g. 'what about the auth service?', 'can you show that function?') "
                "that only makes sense in light of a prior codebase discussion in the history.\n\n"
                "If the current query introduces a new, self-contained topic unrelated to this repository "
                "(general programming tutorials, language syntax questions, general knowledge, geography, "
                "history, small talk, etc.), it is isRepoRelated: false — even if the conversation history "
                "was about this repo. Earlier repo discussion never makes an unrelated new question repo-related.\n\n"
                "Examples:\n"
                f"- History about {repo_name} auth flow; query 'what about the payment service?' -> true (follow-up)\n"
                f"- History about {repo_name} auth flow; query 'how do I sort a list in Python?' -> false (general tutorial)\n"
                "- No history; query 'hello' -> false\n"
                f"- No history; query 'explain the folder structure' -> true (about the repo)\n"
                "CRITICAL: You MUST call the provided function to structure your output. Do not respond with plain text."
            )),
            HumanMessage(content=f"Current query: {state['query']}{history_block}")
        ]
        fallback = CheckRepoRelevance(isRepoRelated=True)
        verdict = _safe_structured_invoke(relevance_checking_llm, messages, fallback, "relevance_check")
        return {"isRepoRelated": verdict.isRepoRelated, "route": "answer"}

    def router_node(state: AgentState) -> AgentState:
        if not state.get("isRepoRelated", True):
            repo = state.get("repo_full_name", "your repository")
            return {
                "result": f"I can only answer questions about **{repo}**. "
                          "Please ask something related to this codebase.",
                "route": "end"
            }

        messages = [
            SystemMessage(content=(
                "You are the routing agent for a repository-scoped codebase assistant. The query has already "
                "been confirmed to be about this repository — do not re-evaluate that. Choose exactly ONE route:\n\n"
                "- 'rag' (default/primary): any question about the codebase, architecture, specific files, "
                "bugs, how something works, or debugging help. If uncertain, choose 'rag'.\n"
                "- 'answer': ONLY for very simple meta questions about the assistant itself.\n"
                "- 'end': ONLY for pure pleasantries ('hello', 'thanks'). Must include a short 'reply'.\n\n"
                "Set 'reply' to null unless route is 'end'. Do not add any field beyond route and reply.\n"
                "CRITICAL: You MUST call the provided function to structure your output. Do not respond with plain text."
            )),
            HumanMessage(content=state["query"])
        ]
        fallback = RouteDecision(route="rag", reply=None)
        result = _safe_structured_invoke(router_llm, messages, fallback, "router")

        if result.route == "end":
            return {"route": "end", "result": result.reply or "Hello!"}
        return {"route": result.route, "result": ""}

    def rag_node(state: AgentState) -> AgentState:
        docs = rag_search_tool(
            state["query"],
            namespace=state.get("namespace"),
        ) if state['route'] == 'rag' else []
        chunks_str = "\n\n".join([d["content"] for d in docs]) if docs else ""
        sources = list(set([d["source"] for d in docs])) if docs else []

        return {
            "rag": chunks_str,
            "rag_sources": sources,
            "route": "answer",
        }

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
            logger.warning(f"[summarize_warning] {e}")
            return {"conversational_summary": ""}

    def answer_node(state: AgentState) -> AgentState:
        repo = state.get("repo_full_name", "unknown")
        ctx_part = []
        if state.get("rag"):
            ctx_part.append("Repository Code Context:\n" + state["rag"])
        if state.get("conversational_summary"):
            ctx_part.append("Prior Conversation:\n" + state["conversational_summary"])
        context = "\n\n".join(ctx_part) if ctx_part else "No supporting context was retrieved from the repository."

        messages = [
            SystemMessage(content=(
                f"You are a precise codebase assistant for the repository '{repo}'. "
                "Only answer questions about this specific repository's code, architecture, "
                "bugs, dependencies, and technical details. If the provided context does not "
                "contain enough information to answer, say so honestly — do not guess or "
                "fabricate code that isn't in the context. "
                f"{GROUNDING_RULE}"
            )),
            HumanMessage(content=f"Question: {state['query']}\n\nContext:\n{context}")
        ]
        ans = answer_llm.invoke(messages).content
        return {"result": ans}

    def check_summary_needed(state: AgentState) -> Literal["Yes", "No"]:
        return "Yes" if state.get("context_str") else "No"

    g = StateGraph(AgentState)
    g.add_node("check_relevance", relevance_checking_node)
    g.add_node("router", router_node)
    g.add_node("rag_lookup", rag_node)
    g.add_node("answer", answer_node)
    g.add_node("summarize", summarizeHistory)

    g.add_conditional_edges(START, check_summary_needed, {"No": "check_relevance", "Yes": "summarize"})
    g.add_edge("summarize", "check_relevance")
    g.add_edge("check_relevance", "router")
    g.add_conditional_edges("router", lambda s: s['route'], {"rag": "rag_lookup", "answer": "answer", "end": END})
    g.add_edge("rag_lookup", "answer")
    g.add_edge("answer", END)

    return g.compile()


agent_cache = {}


def get_cached_agent(model_name: str):
    if model_name not in agent_cache:
        logger.info(f"Compiling graph for model: {model_name}...")
        agent_cache[model_name] = build_agent_graph(model_name)
    return agent_cache[model_name]


@app.post("/query")
def aiBot(data: AIQuery):
    agent = get_cached_agent(data.model_name)

    joined_context = "\n".join(data.context) if data.context else ""

    initial_state = {
        "query": data.query,
        "context_str": joined_context,
        "namespace": data.namespace,
        "repo_full_name": data.repo_full_name,
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
    model_name: str = "llama-3.3-70b-versatile"
    callback_url: str
    callback_token: str


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
        embed_fn = lambda texts: _embed_with_retry(embeddings.embed_documents, texts)
        count = ingest_repo_files(data.repo_full_name, data.namespace, files, index, embed_fn)
        return {"indexed": count}
    except Exception as e:
        logger.error(f"error in /index {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/reindex")
def reindex_repo(data: ReindexRequest):
    try:
        files = [f.dict() for f in data.files]
        embed_fn = lambda texts: _embed_with_retry(embeddings.embed_documents, texts)
        count = reindex_repo_files(
            data.repo_full_name, data.namespace, files, data.removed_paths,
            index, embed_fn,
        )
        return {"reindexed": count, "removed": len(data.removed_paths)}
    except Exception as e:
        logger.error(f"error in /reindex {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    
review_llm_cache: dict[str, Any] = {}


def get_review_llm(model_name: str):
    if model_name not in review_llm_cache:
        review_llm_cache[model_name] = ChatGroq(model=model_name, temperature=0)
    return review_llm_cache[model_name]

def _review_rag_search(query: str, repo_namespace: str) -> list[dict]:
    """Single embedding call instead of multi-query expansion — a diff hunk
    is already specific text, unlike a short ambiguous chat question, so
    paraphrasing it into 3 variants buys little recall for real token cost."""
    query_vector = _embed_with_retry(embeddings.embed_query, query)  # zero LLM calls
        
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


review_parser = JsonOutputParser(pydantic_object=HunkReview)

def _review_hunk(model_name: str, filename: str, hunk_text: str, context_chunks: list[dict]) -> HunkReview:
    context_str = "\n\n".join(
        f"[{c.get('file_path') or c['source']}] {c['text']}" for c in context_chunks
    ) if context_chunks else "No related context was retrieved."

    messages = [
        SystemMessage(content=(
            "You are a precise, conservative code reviewer. You are given one hunk (a contiguous block "
            "of changes) from a pull request diff, plus retrieved context from the project's own codebase "
            "and general best-practice knowledge. Flag an issue ONLY if it is specific and grounded in the "
            "diff or the given context — never invent a problem to have something to say. "
            "Never invent facts, APIs, function or class names that are not present in the code. "
            "If you are not confident the issue is real, or you are just hedging your bets, set has_issue to False.\n"
            "CRITICAL: You must output your final review as a valid JSON object matching the schema below. "
            f"\n{review_parser.get_format_instructions()}"
        )),
        HumanMessage(content=f"File: {filename}\n\nDiff hunk:\n{hunk_text}\n\nRetrieved context:\n{context_str}")
    ]
    fallback = HunkReview(has_issue=False, severity="info", comment="")
    
    llm = get_review_llm(model_name)
    retries = 3
    for attempt in range(retries):
        try:
            response = llm.invoke(messages)
            parsed = review_parser.invoke(response)
            
            # Extract rate limit headers from Groq response metadata if available
            # langchain_groq puts response metadata in the message object
            # If we are close to the limit, we sleep
            rate_limit_remaining = response.response_metadata.get("rate_limit", {}).get("remaining_requests")
            if rate_limit_remaining is not None and int(rate_limit_remaining) < 10:
                logger.info(f"[rate_limit] Nearing Groq limit ({rate_limit_remaining} left). Sleeping 5s.")
                time.sleep(5)
                
            return HunkReview(**parsed)
        except Exception as e:
            err_str = str(e).lower()
            if "429" in err_str or "rate limit" in err_str:
                sleep_time = 10 * (attempt + 1)
                logger.error(f"[hunk_review_error] Rate limit exceeded. Sleeping {sleep_time}s and retrying...")
                time.sleep(sleep_time)
                continue
            logger.warning(f"[hunk_review_warning] manual parse attempt {attempt + 1}/{retries} failed: {e}")
            
    logger.warning(f"[hunk_review_warning] all {retries} attempts failed, using fallback")
    return fallback


MAX_HUNKS_PER_REVIEW = 40

def _process_review_background(data: ReviewRequest):
    all_findings: list[ReviewFinding] = []
    all_sources: set[str] = set()
    hunks_processed = 0

    for file in data.files:
        if hunks_processed >= MAX_HUNKS_PER_REVIEW:
            break
        for hunk in _split_patch_into_hunks(file.patch):
            if hunks_processed >= MAX_HUNKS_PER_REVIEW:
                break
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

    result = ReviewResult(findings=all_findings, rag_sources=list(all_sources))
    
    try:
        httpx.post(
            data.callback_url,
            json=result.dict(),
            headers={"Authorization": f"Bearer {data.callback_token}"},
            timeout=30,
        )
    except Exception as e:
        logger.error(f"[review_callback_error] failed to deliver result to {data.callback_url}: {e}")

@app.post("/delete_namespace")
def delete_namespace(data: dict):
    try:
        namespace = data.get("namespace")
        if not namespace:
            raise HTTPException(status_code=400, detail="namespace is required")
        index = pc.Index(INDEX_NAME)
        index.delete(delete_all=True, namespace=namespace)
        return {"status": "success", "message": f"Namespace {namespace} deleted."}
    except Exception as e:
        if "404" in str(e) or "Namespace not found" in str(e):
            return {"status": "success", "message": f"Namespace {namespace} did not exist."}
        logger.error(f"Error deleting namespace: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/review")
def review_pr(data: ReviewRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(_process_review_background, data)
    return {"status": "processing"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000)