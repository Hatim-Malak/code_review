# HatMind — AI-Powered Python Code Review Assistant

HatMind is a full-stack web application for asking coding questions, getting AI-powered Python code reviews, and continuing a conversation with persistent chat history. The product is split into three main parts:

- Frontend: a React + Vite app with a polished chat experience
- Backend: an Express + Node.js API that handles authentication, chat persistence, and Socket.IO events
- AI service: a FastAPI + Python service that routes queries through language detection, knowledge-base retrieval, web search, and LLM generation

This repository is designed for local development first, but the frontend and backend are also wired for deployment-friendly environments.

## Table of Contents

- [What the app does](#what-the-app-does)
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
- access a chat-based interface for asking Python coding questions
- paste or describe code and receive AI-generated explanations, bug findings, optimization guidance, or refactors
- keep a conversation history for their account
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

The backend auth flow is implemented in:

- [Backend/src/controller/auth.controller.js](Backend/src/controller/auth.controller.js)
- [Backend/src/middleware/auth.middleware.js](Backend/src/middleware/auth.middleware.js)
- [Backend/src/lib/util.js](Backend/src/lib/util.js)

### 2. Chat experience in the browser

The frontend chat experience includes:

- a large message composer for sending prompts or pasted code
- suggested starter prompts such as review, optimize, find bugs, and refactor
- message rendering that supports both plain text and code blocks
- animated code blocks for readability
- automatic scroll to the latest message
- loading state while a request is pending

The main UI is implemented in:

- [Frontend/src/pages/ChatPage.jsx](Frontend/src/pages/ChatPage.jsx)
- [Frontend/src/store/useChatStore.js](Frontend/src/store/useChatStore.js)

### 3. AI-powered response generation

When the user submits a prompt, the app sends the request to the Python AI service. The service performs the following:

- checks whether the input is related to Python
- decides whether to answer directly, use a retrieval-augmented generation (RAG) lookup, or fall back to web search
- optionally queries a knowledge base stored in Pinecone
- optionally runs a web search via Tavily
- generates an answer using a Groq-backed LLM

This logic is implemented in:

- [ai/main.py](ai/main.py)

### 4. Persistent chat history

Every successful prompt is saved to MongoDB with:

- the authenticated user ID
- the user message
- the AI response
- timestamps

The chat history can be loaded later for the same user.

### 5. Real-time updates

The backend exposes Socket.IO events so the frontend can receive the AI response as soon as it is finished. The frontend joins a user-specific room and listens for the event before updating the chat UI.

## How the system works end-to-end

### A. User signs in or signs up

1. The frontend sends credentials to the backend auth route.
2. The backend validates the input and hashes the password with bcrypt.
3. A JWT is created and placed into an HTTP-only cookie.
4. The frontend stores the authenticated user in Zustand state.

### B. User opens the chat screen

1. The app checks if the user is authenticated.
2. If yes, the frontend connects to the Socket.IO server and loads chat history for that user.
3. The chat screen displays the previously stored conversations.

### C. User sends a message

1. The frontend collects the prompt from the textarea.
2. It appends a temporary pending message to the local conversation state.
3. It sends the message to the backend endpoint /api/chat/add_chat.
4. The backend authenticates the request, validates the query, and creates a UUID-based thread ID.
5. The backend calls the Python AI service at http://localhost:8000/query.
6. The AI service processes the prompt and returns a response string.
7. The backend saves the exchange to MongoDB.
8. The backend emits a Socket.IO event to the user’s room.
9. The frontend receives that event and replaces the temporary loading state with the real AI message.

### D. AI service processing flow

Inside the Python service:

1. The incoming payload is parsed into query, model name, and thread ID.
2. A language classifier checks if the request is related to Python.
3. The router determines the best route:
   - answer: respond directly if the question is simple and no external knowledge is required
   - rag: look into the knowledge base first
   - end: stop early for unsupported or non-Python requests
4. If RAG is selected, the service embeds the user query and queries Pinecone for similar context chunks.
5. If the RAG result is judged insufficient, the service falls back to Tavily web search.
6. The final answer is generated by a Groq model and returned to the backend.

## Project structure

```text
code-review-website/
├── Backend/
│   ├── src/
│   │   ├── controller/
│   │   │   ├── auth.controller.js
│   │   │   └── chat.controller.js
│   │   ├── lib/
│   │   │   ├── db.js
│   │   │   └── util.js
│   │   ├── middleware/
│   │   │   └── auth.middleware.js
│   │   ├── models/
│   │   │   ├── chat.model.js
│   │   │   └── user.model.js
│   │   ├── routes/
│   │   │   ├── auth.route.js
│   │   │   └── chat.route.js
│   │   └── index.js
│   ├── package.json
│   └── README.md
├── Frontend/
│   ├── src/
│   │   ├── component/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── ai/
│   ├── main.py
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

### Backend

- Node.js
- Express.js
- MongoDB with Mongoose
- Socket.IO
- JWT authentication with jsonwebtoken
- bcryptjs for password hashing
- cookie-parser for auth cookies
- Axios for calling the Python AI service
- UUID for per-request thread IDs

### AI service

- Python 3.13+ (as defined in the project config)
- FastAPI
- LangGraph
- LangChain
- Groq LLM integration
- Hugging Face embeddings
- Pinecone vector index
- Tavily search integration
- Python dotenv and Uvicorn

## Prerequisites

Make sure these are installed before running the project:

- Node.js 18+ or newer
- npm
- Python 3.10+ (3.13+ is preferred based on the config)
- MongoDB running locally or a MongoDB Atlas connection string
- A Groq API key
- A Pinecone API key and environment
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
  "model_name": "llama-3.1-8b-instant"
}
```

Behavior:

- validates that the user query exists
- creates a new UUID-based thread ID
- sends the request to the AI service
- stores the result in MongoDB
- emits a Socket.IO event to the current user

#### GET /api/chat/history

Returns the chat history for the authenticated user.

## Important implementation details

### Authentication implementation

- Passwords are hashed using bcrypt before storage.
- JWTs are issued by the backend and stored in an HTTP-only cookie.
- The protected route middleware reads the cookie, verifies it, and attaches the user to req.user.

### Chat persistence model

Each chat record contains:

- userId: the MongoDB ObjectId of the authenticated user
- user_message: the prompt entered by the user
- AI_message: the generated response
- timestamps added by Mongoose

### Socket.IO behavior

The backend creates a Socket.IO server and joins each authenticated user into their own room using the user ID. The frontend connects to the server and listens for the aiMessage event to update the conversation in real time.

### AI routing behavior

The Python service is not a simple single-prompt LLM wrapper. It uses a small reasoning pipeline:

- language check node
- router node
- RAG lookup node
- web search node
- answer node

This design allows the assistant to decide when to use context retrieval, external search, or direct answering.

### Knowledge base and search

The app currently uses:

- a Pinecone index named kb-index
- embeddings from Hugging Face
- Tavily search for external information

If the knowledge-base lookup is insufficient, the assistant falls back to the web.

### Current scope

The current implementation is focused on Python-related questions. If the user asks about a non-Python topic, the assistant is designed to respond that it cannot answer that class of question.

## Troubleshooting

### Backend cannot connect to MongoDB

Check that:

- MongoDB is running
- the MONGODB_URL in Backend/.env is correct
- your local MongoDB instance allows connections from localhost

### AI service returns errors

Check that:

- the Python dependencies are installed
- the .env file inside ai contains valid API keys
- the Pinecone index exists or can be created
- the Groq and Tavily credentials are valid

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

## Contribution

If you want to improve the project:

1. create a feature branch
2. make your changes
3. test them locally
4. open a pull request with a clear description

This project is best improved by keeping the frontend, backend, and AI service behavior aligned, especially when changing the request/response contract between them.
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
- Powered by OpenAI and modern web technologies

---

<div align="center">

**[^ back to top](#-code-review-website)**

Made with attention to detail by developers, for developers

</div>
