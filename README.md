# HatMind — AI-Powered Python Code Review Assistant

HatMind is a full-stack web application for asking coding questions, getting AI-powered Python code reviews, and continuing a conversation with persistent chat history. The product is split into three main parts:

- Frontend: a React + Vite app with a polished chat experience
- Backend: an Express + Node.js API that handles authentication, chat persistence, and Socket.IO events
- AI service: a FastAPI + Python service that routes queries through language detection, knowledge-base retrieval, web search, and LLM generation

This repository is designed for local development first, but the frontend and backend are also wired for deployment-friendly environments.

---

## ✨ What's New

This section highlights the major new features and improvements that have been added to the project.

### 🗂️ Conversation Session System (Multi-Chat)

The app now supports a full multi-conversation workflow, similar to ChatGPT's sidebar experience.

**What was added:**

- **ChatSidebar component** ([ChatSidebar.jsx](Frontend/src/components/ChatSidebar.jsx)): a responsive sidebar that lists all past conversations with searchable titles, relative timestamps, and a two-click delete confirmation flow. Includes a mobile overlay with backdrop blur.
- **Session management in the chat store** ([useChatStore.js](Frontend/src/store/useChatStore.js)): new Zustand state for `sessions`, `activeSessionId`, `isLoadingSessions`, and `isHistoryLoading`. New actions: `loadSessions()`, `selectSession()`, `startNewChat()`, and `deleteSession()`.
- **Backend endpoints** ([chat.controller.js](Backend/src/controller/chat.controller.js), [chat.route.js](Backend/src/routes/chat.route.js)):
  - `GET /api/chat/sessions` — returns all conversation sessions for the user using a MongoDB aggregation pipeline with auto-generated titles.
  - `DELETE /api/chat/session/:converId` — deletes an entire conversation and all its messages.
  - `GET /api/chat/history?converId=...` — now requires a `converId` query param to fetch messages for a specific conversation.
- **Auto-generated conversation titles**: the first user message in a new conversation is truncated to 50 characters and stored as the session title.
- **Chat model updated** ([chat.model.js](Backend/src/models/chat.model.js)): new fields `conversationId` (String, required) and `title` (String, nullable) added to the schema.

---

### 🏠 Homepage Landing Page

A brand new, marketing-grade homepage was added.

**What was added:**

- **HomePage component** ([HomePage.jsx](Frontend/src/pages/HomePage.jsx)): a full-screen hero section with the HatMind brand, animated floating background icons (Code2, Sparkles, TerminalSquare), a fade-in entrance animation, and CTA buttons leading to the chat and about pages.
- **TextType typewriter component** ([TextType.jsx](Frontend/src/components/TextType.jsx)): a GSAP-powered typewriter animation component that cycles through an array of taglines with configurable typing speed, delete speed, pause duration, cursor blinking, reverse mode, intersection observer for start-on-visible, and variable speed support.
- **Route added**: `path='/'` now renders `<HomePage/>` instead of redirecting to login.

---

### 📖 About Page

A full about/mission page was added to the frontend.

**What was added:**

- **AboutPage component** ([AboutPage.jsx](Frontend/src/pages/AboutPage.jsx)): includes a hero section with floating background elements, a feature grid with `FeatureCard` components (Lightning Fast, Secure & Reliable, Learn as you Code), a CTA section, and a footer.
- **Route added**: `path='/about'` renders `<AboutPage/>`.
- **Dynamic nav items**: both the homepage and about page dynamically adjust navigation items based on authentication state (showing Chat/Logout when logged in, Login/Sign Up when logged out).

---

### 🧭 Custom Navbar

A reusable, premium navigation bar replaced any previous nav implementation.

**What was added:**

- **CustomNavbar component** ([CustomNavbar.jsx](Frontend/src/components/CustomNavbar.jsx)):
  - Scroll-aware: transitions from transparent to frosted glass (`backdrop-blur-md`) on scroll.
  - Active route highlighting with a pill-shaped indicator.
  - Mobile hamburger menu with animated expand/collapse.
  - Optional sidebar toggle button for the chat page (mobile only).
  - Logo with hover scale animation.

---

### 🎨 Auth Visual Panel

The login and signup pages now feature an immersive branded visual panel.

**What was added:**

- **AuthVisual component** ([AuthVisual.jsx](Frontend/src/components/AuthVisual.jsx)): a half-screen dark green panel displayed on large screens alongside the auth forms. Features 8 floating glass-morphism tiles with code-themed icons (Braces, Terminal, Cpu, Code), a central "Ai" logo badge, and promotional copy.
- **Login and Signup redesigned** ([LoginPage.jsx](Frontend/src/pages/LoginPage.jsx), [SignUpPage.jsx](Frontend/src/pages/SignUpPage.jsx)): both pages now use a split-screen layout with `AuthVisual` on one side and the form on the other. Include tab-style Login/SignUp toggle, "Back to Home" link, and premium input styling.

---

### 🔍 Advanced RAG Pipeline (Multi-Query + Cross-Encoder Reranking)

The AI service's retrieval-augmented generation was significantly upgraded.

**What was added in** [ai/main.py](ai/main.py):

- **Multi-Query Expansion**: before querying Pinecone, the user's query is expanded into 3 alternative phrasings via a structured LLM call (`MultiQueries` model). All variants are searched in parallel, and results are de-duplicated.
- **Cross-Encoder Reranking**: after initial retrieval, all candidate chunks are reranked using a Cross-Encoder model (`cross-encoder/ms-marco-MiniLM-L-6-v2`) from `sentence-transformers`. The top 3 chunks by reranker score are selected.
- **Metadata filtering**: the RAG search supports optional `source_filter` to restrict retrieval to specific dataset sources.
- **Structured output with fallback** (`_safe_structured_invoke`): all structured LLM calls are wrapped in a try/except that gracefully falls back to default values if parsing fails, preventing crashes.
- **Agent caching**: compiled LangGraph agents are cached per model name to avoid recompilation on every request.

---

### 🧠 Conversation History Summarization

The AI service now intelligently summarizes prior conversation context.

**What was added in** [ai/main.py](ai/main.py):

- **Summarize node** (`summarizeHistory`): a new LangGraph node that compresses chat history into a factual briefing using a fast LLM (`llama-3.1-8b-instant`). Uses different system prompts based on context length (short vs. long history).
- **Conditional routing**: the graph now conditionally routes through the summarize node only when conversation context is present, via `check_summary_needed`.
- **Context-aware language checking**: the language classifier now receives the conversation summary to correctly handle ambiguous follow-up messages (e.g., "what about for CSV files?" after a Python discussion).
- **Backend sends context**: the backend now fetches the last 7 messages from the conversation and sends them as `context` to the AI service.

---

### 📚 Knowledge Base Ingestion Pipeline

A new standalone script was added for populating the Pinecone knowledge base.

**What was added:**

- **ingestion.py** ([ai/ingestion.py](ai/ingestion.py)): a complete ETL pipeline that:
  - Loads Python code instruction datasets from Hugging Face (currently active: `ammarnasr/Python-Security-Code-Dataset`; commented-out support for `iamtarun/python_code_instructions_18k_alpaca`, `flytech/python-codes-25k`, `karti06k/Qwen-59k-Python-Instruct`, `ed001/ds-coder-instruct-v1`).
  - Chunks and embeds content using BGE-M3 via HuggingFace Inference API with automatic retry and rate limiting.
  - Upserts vectors to Pinecone with metadata (text, code_solution, source, token_count, chunk_index).
  - Includes a `Chunk` TypedDict schema and a full summary report with token statistics.
- **Python documentation PDFs** stored in `ai/python/`: 36 official Python documentation PDFs (library reference, tutorial, how-tos, FAQ, etc.) available for potential knowledge base expansion.

---

### 🏷️ RAG Source Attribution in Chat UI

AI responses now show which knowledge sources were used.

**What was added:**

- **Backend returns `rag_sources`**: the `addChat` controller now extracts `rag_sources` from the AI service response, stores them in MongoDB, and emits them via Socket.IO.
- **Chat model updated**: `rag_sources` field (array of strings) added to the chat schema.
- **Frontend displays sources** ([ChatPage.jsx](Frontend/src/pages/ChatPage.jsx)): below each AI response, a "Sources Utilized" section renders clickable pills for each source URL/name, with automatic hostname extraction for clean display.

---

### 📝 Rich Markdown Rendering in AI Responses

AI messages now render as formatted markdown instead of plain text.

**What was added:**

- **ReactMarkdown with GFM** ([ChatPage.jsx](Frontend/src/pages/ChatPage.jsx)): text portions of AI responses are rendered through `react-markdown` with `remark-gfm` plugin for tables, strikethrough, task lists, and auto-links.
- **Custom markdown styles** ([index.css](Frontend/src/index.css)): `.markdown-body` styles for paragraphs, lists, headings, bold text, and tables with HatMind-themed styling.
- **Animated code blocks** ([animated-code-block.tsx](Frontend/src/components/animated-code-block.tsx)): code blocks in AI responses are rendered with typing animation, syntax highlighting, and line numbers. Auto-plays only for the most recent message.

---

### 🔎 SEO & Meta Tags

Every page now includes proper SEO metadata.

**What was added:**

- **react-helmet-async** integrated in [main.jsx](Frontend/src/main.jsx): `<HelmetProvider>` wraps the entire app.
- **Per-page meta tags**: each page (Home, About, Login, SignUp, Chat) sets its own `<title>` and `<meta name="description">` via `<Helmet>`.
- **Open Graph & Twitter Cards** ([index.html](Frontend/index.html)): the root HTML includes `og:title`, `og:description`, `og:type`, `og:url`, `twitter:card`, `twitter:title`, `twitter:description`, and `theme-color` meta tags.
- **Structured keywords**: keywords meta tag added for SEO indexing.

---

### 🚀 Deployment Readiness

The backend is now configured for deployment beyond localhost.

**What was added:**

- **Vercel origin allowed** ([index.js](Backend/src/index.js)): the CORS allowed origins list now includes `https://starlit-stationary-frontend.vercel.app` alongside the localhost origins, enabling frontend deployment to Vercel.
- **Dynamic CORS handler**: uses an origin callback function instead of a static string, with support for non-browser tools (Postman, etc.).

---

## Table of Contents

- [What the app does](#what-the-app-does)
- [What's New](#-whats-new)
- [Core features](#core-features)
- [How the system works end-to-end](#how-the-system-works-end-to-end)
- [Project structure](#project-structure)
- [Technology stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Environment setup](#environment-setup)
- [Installation](#installation)
- [Running the app locally](#running-the-app-locally)
- [API reference](#api-reference)
- [Important implementation details](#important-implementation-details)
- [Troubleshooting](#troubleshooting)

## What the app does

Users can:

- create an account and log in securely
- browse a polished homepage and about page before signing up
- access a chat-based interface for asking Python coding questions
- paste or describe code and receive AI-generated explanations, bug findings, optimization guidance, or refactors
- manage multiple conversation sessions with searchable history and delete functionality
- see which knowledge sources the AI used to generate each answer
- receive live updates while the AI is generating a reply

The experience is optimized around Python, and the AI service explicitly classifies whether a request is Python-related before answering.

## Core features

### 1. Authentication and protected access

The app includes full user auth flow:

- sign up with full name, email, and password
- log in with email and password
- logout
- session checks using a JWT stored in an HTTP-only cookie
- protected routes on the backend using middleware that verifies the token and loads the authenticated user
- split-screen auth pages with immersive branded visual panel

The backend auth flow is implemented in:

- [Backend/src/controller/auth.controller.js](Backend/src/controller/auth.controller.js)
- [Backend/src/middleware/auth.middleware.js](Backend/src/middleware/auth.middleware.js)
- [Backend/src/lib/util.js](Backend/src/lib/util.js)

### 2. Chat experience in the browser

The frontend chat experience includes:

- a large message composer for sending prompts or pasted code (auto-expanding textarea with Enter-to-send)
- suggested starter prompts such as review, optimize, find bugs, and refactor
- rich markdown rendering for AI responses (tables, lists, headings, bold)
- animated code blocks with syntax highlighting and line numbers
- automatic scroll to the latest message
- loading state with animated dots while a request is pending
- RAG source attribution pills below each AI response
- conversation session sidebar with search, new chat, and delete functionality

The main UI is implemented in:

- [Frontend/src/pages/ChatPage.jsx](Frontend/src/pages/ChatPage.jsx)
- [Frontend/src/components/ChatSidebar.jsx](Frontend/src/components/ChatSidebar.jsx)
- [Frontend/src/store/useChatStore.js](Frontend/src/store/useChatStore.js)

### 3. AI-powered response generation

When the user submits a prompt, the app sends the request to the Python AI service. The service performs the following:

- summarizes conversation history for context (if present)
- checks whether the input is related to Python
- decides whether to answer directly, use a retrieval-augmented generation (RAG) lookup, or fall back to web search
- expands the query into multiple phrasings for improved semantic recall (Multi-Query)
- queries the knowledge base stored in Pinecone and reranks results with a Cross-Encoder
- optionally runs a web search via Tavily if RAG results are insufficient
- generates an answer using a Groq-backed LLM with grounding rules to prevent hallucination
- returns source attribution alongside the response

This logic is implemented in:

- [ai/main.py](ai/main.py)

### 4. Persistent chat history with conversation sessions

Every successful prompt is saved to MongoDB with:

- the authenticated user ID
- a conversation ID (UUID) linking messages to a session
- an auto-generated conversation title (from the first message)
- the user message
- the AI response
- RAG source URLs
- timestamps

Users can browse, search, switch between, and delete conversation sessions through the sidebar.

### 5. Real-time updates

The backend exposes Socket.IO events so the frontend can receive the AI response as soon as it is finished. The frontend joins a user-specific room and listens for the event before updating the chat UI.

### 6. Homepage and About Page

The app now includes polished marketing-grade pages:

- **Homepage** ([HomePage.jsx](Frontend/src/pages/HomePage.jsx)): full-screen hero with brand identity, GSAP-powered typewriter animation cycling through taglines, floating background icons, fade-in entrance, and CTA buttons
- **About Page** ([AboutPage.jsx](Frontend/src/pages/AboutPage.jsx)): mission statement, feature cards grid, call-to-action section, and footer

### 7. Knowledge Base Ingestion

A standalone ingestion pipeline ([ai/ingestion.py](ai/ingestion.py)) handles:

- loading Python code instruction datasets from Hugging Face
- chunking, embedding via BGE-M3, and upserting to Pinecone
- support for multiple dataset sources (security, web frameworks, data science, general Python)
- token statistics and progress reporting

## How the system works end-to-end

### A. User visits the site

1. The homepage is displayed with the HatMind brand and CTA buttons.
2. The user can browse the about page or navigate to login/signup.

### B. User signs in or signs up

1. The frontend sends credentials to the backend auth route.
2. The backend validates the input and hashes the password with bcrypt.
3. A JWT is created and placed into an HTTP-only cookie.
4. The frontend stores the authenticated user in Zustand state.
5. The immersive AuthVisual panel is displayed alongside the form on large screens.

### C. User opens the chat screen

1. The app checks if the user is authenticated.
2. If yes, the frontend connects to the Socket.IO server and loads all conversation sessions for the sidebar.
3. The user can start a new chat, select a previous conversation, search through sessions, or delete old ones.

### D. User sends a message

1. The frontend collects the prompt from the textarea.
2. It appends a temporary pending message to the local conversation state.
3. It sends the message to the backend endpoint /api/chat/add_chat, including the active `converId` if continuing a session.
4. The backend authenticates the request, validates the query, and generates a UUID-based conversation ID if this is a new session.
5. The backend fetches the last 7 messages for context and calls the Python AI service.
6. The AI service processes the prompt through its LangGraph pipeline and returns a response with source attribution.
7. The backend saves the exchange to MongoDB with `conversationId`, `title`, and `rag_sources`.
8. The backend emits a Socket.IO event to the user's room with the response and sources.
9. The frontend receives that event and replaces the temporary loading state with the real AI message and source pills.
10. The sidebar session list is refreshed to show the new/updated conversation.

### E. AI service processing flow

Inside the Python service:

1. The incoming payload is parsed into query, model name, context, and thread ID.
2. **Conditional summarization**: if conversation context is present, a fast LLM compresses it into a factual briefing.
3. **Language classifier**: checks if the request is Python-related (context-aware for follow-up questions).
4. **Router**: determines the best route:
   - answer: respond directly if the question is a basic conceptual definition
   - rag: look into the knowledge base first (default for most queries)
   - end: stop early for greetings/pleasantries
5. **RAG lookup with Multi-Query + Reranking**:
   - Expands the query into 3 alternative phrasings
   - Queries Pinecone with each variant (top-k=20)
   - De-duplicates candidates and reranks with Cross-Encoder
   - Selects top 3 chunks
   - A judge LLM evaluates if the retrieved context is sufficient
6. If RAG is judged insufficient, the service falls back to **Tavily web search**.
7. The final answer is generated by a Groq model with grounding rules, and source attribution is returned alongside.

## Project structure

```text
code-review-website/
├── Backend/
│   ├── src/
│   │   ├── controller/
│   │   │   ├── auth.controller.js
│   │   │   └── chat.controller.js        # Added: getSessions, deleteSession, converId support
│   │   ├── lib/
│   │   │   ├── db.js
│   │   │   └── util.js
│   │   ├── middleware/
│   │   │   └── auth.middleware.js
│   │   ├── models/
│   │   │   ├── chat.model.js              # Updated: conversationId, title, rag_sources fields
│   │   │   └── user.model.js
│   │   ├── routes/
│   │   │   ├── auth.route.js
│   │   │   └── chat.route.js              # Added: /sessions, /session/:converId routes
│   │   └── index.js                       # Updated: Vercel origin, dynamic CORS
│   ├── package.json
│   └── README.md
├── Frontend/
│   ├── public/
│   │   └── HatMind.jpg
│   ├── src/
│   │   ├── components/
│   │   │   ├── animated-code-block.tsx     # NEW: animated syntax-highlighted code blocks
│   │   │   ├── AuthVisual.jsx             # NEW: immersive branded panel for auth pages
│   │   │   ├── ChatSidebar.jsx            # NEW: conversation session sidebar
│   │   │   ├── CustomNavbar.jsx           # NEW: scroll-aware responsive navbar
│   │   │   └── TextType.jsx              # NEW: GSAP typewriter animation component
│   │   ├── lib/
│   │   │   ├── axios.js
│   │   │   └── utils.ts                   # NEW: cn() utility (clsx + tailwind-merge)
│   │   ├── pages/
│   │   │   ├── AboutPage.jsx              # NEW: about/mission page
│   │   │   ├── ChatPage.jsx               # Updated: sidebar, markdown, sources, animated code
│   │   │   ├── HomePage.jsx               # NEW: landing page with hero and typewriter
│   │   │   ├── LoginPage.jsx              # Updated: AuthVisual, redesigned layout
│   │   │   └── SignUpPage.jsx             # Updated: AuthVisual, redesigned layout
│   │   ├── store/
│   │   │   ├── useAuthStore.js
│   │   │   └── useChatStore.js            # Updated: session management, delete, search
│   │   ├── App.jsx                        # Updated: new routes (/, /about)
│   │   ├── index.css                      # Updated: markdown styles, scrollbar styles
│   │   └── main.jsx                       # Updated: HelmetProvider wrapper
│   ├── index.html                         # Updated: OG tags, Twitter cards, SEO meta
│   ├── package.json
│   └── vite.config.js
├── ai/
│   ├── main.py                            # Updated: Multi-Query, Cross-Encoder, summarization
│   ├── ingestion.py                       # NEW: knowledge base ETL pipeline
│   ├── python/                            # NEW: 36 Python documentation PDFs
│   ├── pyproject.toml
│   ├── requirement.txt
│   └── README.md
└── README.md
```

## Technology stack

### Frontend

- React
- Vite
- Tailwind CSS
- Zustand for state management
- React Router for page navigation
- Axios for API calls
- Socket.IO client for live updates
- React Hot Toast for notifications
- **react-helmet-async** for per-page SEO meta tags
- **ReactMarkdown + remark-gfm** for rich AI response rendering
- **GSAP** for typewriter and cursor animations
- **Lucide React** for consistent icon system
- **clsx + tailwind-merge** for conditional class utilities

### Backend

- Node.js
- Express.js
- MongoDB with Mongoose
- Socket.IO
- JWT authentication with jsonwebtoken
- bcryptjs for password hashing
- cookie-parser for auth cookies
- Axios for calling the Python AI service
- UUID for per-conversation session IDs

### AI service

- Python 3.13+ (as defined in the project config)
- FastAPI
- LangGraph (StateGraph with conditional routing)
- LangChain
- Groq LLM integration (ChatGroq)
- Hugging Face embeddings (BGE-M3 via Inference API)
- **sentence-transformers Cross-Encoder** (ms-marco-MiniLM-L-6-v2) for reranking
- Pinecone vector index
- Tavily search integration
- **Hugging Face datasets** for knowledge base ingestion
- **tqdm** for progress bars
- **tenacity** for retry logic
- Python dotenv and Uvicorn

## Prerequisites

Make sure these are installed before running the project:

- Node.js 18+ or newer
- npm
- Python 3.10+ (3.13+ is preferred based on the config)
- MongoDB running locally or a MongoDB Atlas connection string
- A Groq API key
- A Pinecone API key and environment
- A HuggingFace API token (for BGE-M3 embeddings)
- A Tavily API key if you want internet-backed search to work

## Environment setup

Create separate environment files for each part of the app.

### Backend environment

Create a file named .env inside Backend:

```env
PORT=5000
NODE_ENV=development
MONGODB_URL=mongodb://127.0.0.1:27017/hatmind
JWT_SECRET=replace_with_a_long_random_secret
AI_SERVICE_URL=http://localhost:8000
```

Important note: the backend currently reads MONGODB_URL, not MONGODB_URI.

### Frontend environment

The frontend currently uses the base URL in [Frontend/src/lib/axios.js](Frontend/src/lib/axios.js). In development it points to http://localhost:5000/api. No extra .env file is required unless you want to customize the endpoint.

### AI service environment

Create a file named .env inside ai:

```env
GROQ_API_KEY=your_groq_api_key
LANGCHAIN_API_KEY=your_langsmith_api_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_ENV=your_pinecone_environment
TAVILY_API_KEY=your_tavily_key
HF_TOKEN=your_huggingface_api_token
```

The Python service also expects the Pinecone index named kb-index to exist or to be created automatically by the code.

## Installation

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd "code review website"
```

### 2. Install frontend dependencies

```bash
cd Frontend
npm install
```

### 3. Install backend dependencies

```bash
cd ../Backend
npm install
```

### 4. Install Python dependencies

From the ai folder, use either pip or uv:

```bash
cd ../ai
pip install -r requirement.txt
```

Or if you are using the project config:

```bash
uv sync
```

### 5. Populate the knowledge base (optional)

Run the ingestion script to embed Python code datasets into Pinecone:

```bash
cd ai
python ingestion.py
```

This will load datasets from Hugging Face, embed them via BGE-M3, and upsert the vectors into Pinecone. This step is optional but improves the quality of RAG responses.

## Running the app locally

### Start MongoDB

If you are running MongoDB locally:

```bash
mongod
```

If you use Docker instead:

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Start the AI service

```bash
cd ai
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Note: on first startup, the Cross-Encoder model (`ms-marco-MiniLM-L-6-v2`) will be downloaded automatically (~25MB).

The API endpoint used by the backend is:

```text
POST http://localhost:8000/query
```

### Start the backend

```bash
cd Backend
npm run dev
```

The backend will listen on port 5000.

### Start the frontend

```bash
cd Frontend
npm run dev
```

Open the frontend at:

```text
http://localhost:5173
```

## API reference

### Authentication

#### POST /api/auth/signup

Creates a new user account.

Request body:

```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "_id": "...",
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "hashed_password"
}
```

#### POST /api/auth/login

Authenticates an existing user.

Request body:

```json
{
  "email": "jane@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "_id": "...",
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "hashed_password"
}
```

#### POST /api/auth/logout

Clears the JWT cookie.

#### GET /api/auth/check

Checks whether the current user is authenticated. Requires a valid JWT cookie.

### Chat

#### POST /api/chat/add_chat

Sends a chat message and gets an AI response.

Headers:

```http
Cookie: jwt=<token>
```

Request body:

```json
{
  "query": "Please review this Python code for best practices",
  "model_name": "llama-3.1-8b-instant",
  "converId": "optional-uuid-for-existing-conversation"
}
```

Behavior:

- validates that the user query exists
- if no `converId` is provided, creates a new UUID-based conversation ID and auto-generates a title
- fetches the last 7 messages for conversation context
- sends the request to the AI service with context
- stores the result in MongoDB with `conversationId`, `title`, and `rag_sources`
- emits a Socket.IO event to the current user with response and sources
- returns the `conversationId` so the frontend can track the session

Response:

```json
{
  "response": "Here's my review of your code...",
  "conversationId": "uuid-string",
  "title": "Please review this Python code for best...",
  "rag_sources": ["ammarnasr_security"]
}
```

#### GET /api/chat/history?converId=uuid

Returns the chat history for a specific conversation of the authenticated user.

#### GET /api/chat/sessions

Returns all conversation sessions for the authenticated user, sorted by most recent activity.

Response:

```json
[
  {
    "conversationId": "uuid-string",
    "title": "How to parse CSV files in Python?",
    "updatedAt": "2026-07-10T12:30:00.000Z"
  }
]
```

#### DELETE /api/chat/session/:converId

Deletes all messages belonging to a specific conversation.

## Important implementation details

### Authentication implementation

- Passwords are hashed using bcrypt before storage.
- JWTs are issued by the backend and stored in an HTTP-only cookie.
- The protected route middleware reads the cookie, verifies it, and attaches the user to req.user.

### Chat persistence model

Each chat record contains:

- userId: the MongoDB ObjectId of the authenticated user
- conversationId: a UUID string linking messages to a session
- title: auto-generated from the first message (nullable, only set on first message)
- user_message: the prompt entered by the user
- AI_message: the generated response
- rag_sources: array of source identifiers used in the response
- timestamps added by Mongoose

### Socket.IO behavior

The backend creates a Socket.IO server and joins each authenticated user into their own room using the user ID. The frontend connects to the server and listens for the aiMessage event to update the conversation in real time. The event now also includes `rag_sources`.

### AI routing behavior

The Python service uses a multi-node LangGraph pipeline:

- **summarize node** — compresses conversation history into a factual briefing
- **language check node** — context-aware Python classification
- **router node** — determines rag/answer/end
- **RAG lookup node** — Multi-Query expansion → Pinecone search → Cross-Encoder reranking → sufficiency judge
- **web search node** — Tavily fallback when RAG is insufficient
- **answer node** — final response generation with grounding rules

The graph conditionally skips the summarize node when no context is present.

### Knowledge base and search

The app currently uses:

- a Pinecone index named kb-index
- BGE-M3 embeddings from Hugging Face Inference API
- Cross-Encoder reranking with ms-marco-MiniLM-L-6-v2
- Multi-Query expansion for improved recall
- Tavily search for external information fallback
- A standalone ingestion pipeline for populating the knowledge base from Hugging Face datasets

If the knowledge-base lookup is insufficient (as judged by a dedicated LLM), the assistant falls back to the web.

### Current scope

The current implementation is focused on Python-related questions. If the user asks about a non-Python topic, the assistant is designed to respond that it cannot answer that class of question. The language classifier is context-aware: it can correctly handle follow-up questions that reference a prior Python discussion.

## Troubleshooting

### Backend cannot connect to MongoDB

Check that:

- MongoDB is running
- the MONGODB_URL in Backend/.env is correct
- your local MongoDB instance allows connections from localhost

### AI service returns errors

Check that:

- the Python dependencies are installed
- the .env file inside ai contains valid API keys (including HF_TOKEN)
- the Pinecone index exists or can be created
- the Groq, Tavily, and HuggingFace credentials are valid
- the Cross-Encoder model can be downloaded (requires internet on first run)

### Frontend cannot reach the backend

Check that:

- the backend is running on port 5000
- CORS is configured for http://localhost:5173
- the frontend is using the correct backend URL in [Frontend/src/lib/axios.js](Frontend/src/lib/axios.js)

### Socket.IO does not update messages

Check that:

- the frontend is connected to the backend Socket.IO server
- the user has joined the correct room
- the backend emitted the aiMessage event after saving the chat message

### Sidebar sessions not loading

Check that:

- the backend `/api/chat/sessions` endpoint is working
- the MongoDB aggregation pipeline does not error (check backend console)
- the frontend calls `loadSessions()` after socket connection

## Contribution

If you want to improve the project:

1. create a feature branch
2. make your changes
3. test them locally
4. open a pull request with a clear description

This project is best improved by keeping the frontend, backend, and AI service behavior aligned, especially when changing the request/response contract between them.

### Roadmap

- [ ] Support for more AI models
- [ ] Code diff visualization
- [ ] Team collaboration features
- [ ] Code snippet sharing
- [ ] Advanced analytics dashboard
- [ ] Browser extensions
- [ ] API rate limiting

### Known Issues

- None currently reported

## ◆ Support

For issues, questions, or suggestions:
- [>] Email: support@codereview.com
- [>] GitHub Issues: [Report a bug](https://github.com/yourusername/code-review-website/issues)
- [>] Discussions: [Join our community](https://github.com/yourusername/code-review-website/discussions)

## ▪ License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## ◆ Acknowledgments

- Built with dedication by the development team
- Thanks to all contributors
- Powered by Groq, LangChain, Pinecone, and modern web technologies

---

<div align="center">

**[^ back to top](#hatmind--ai-powered-python-code-review-assistant)**

Made with attention to detail by developers, for developers

</div>
just to test what is happening
why isnt anything happening in my repo