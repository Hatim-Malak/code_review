# 🚀 Code Review Backend

> A powerful Node.js backend service for AI-powered code review and real-time chat functionality

## ✨ Features

- **🤖 AI Code Review** - Leverage AI models to provide intelligent code reviews and suggestions
- **💬 Real-Time Chat** - WebSocket-powered real-time messaging with Socket.io
- **🔐 Authentication** - Secure user authentication and authorization
- **📚 Chat History** - Persistent storage of conversation history
- **⚡ Fast & Scalable** - Built with Express.js for high performance

## 📁 Project Structure

```
Backend/
├── src/
│   ├── controller/           # Route controllers (business logic)
│   │   ├── auth.controller.js
│   │   └── chat.controller.js
│   ├── models/               # Database models
│   │   ├── user.model.js
│   │   └── chat.model.js
│   ├── routes/               # API routes
│   │   ├── auth.route.js
│   │   └── chat.route.js
│   ├── middleware/           # Custom middleware
│   │   └── auth.middleware.js
│   ├── lib/                  # Utilities & helpers
│   │   ├── db.js
│   │   └── util.js
│   └── index.js              # Entry point
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Chat Endpoints

#### `POST /api/chat/add`
Add a new chat message and get AI response.

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "query": "Review my code",
  "model_name": "gpt-4"
}
```

**Response:**
```json
{
  "response": "AI review response here..."
}
```

#### `GET /api/chat/history`
Retrieve chat history for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "_id": "...",
    "user_message": "Review my code",
    "AI_message": "AI review response..."
  }
]
```

### Auth Endpoints
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Authenticate user

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB
- **Real-Time:** Socket.io
- **HTTP Client:** Axios
- **Authentication:** JWT

## 🚀 Getting Started

### Prerequisites
- Node.js v16+
- MongoDB
- Python backend (AI service running on port 8000)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/codereview
   JWT_SECRET=your_secret_key
   AI_SERVICE_URL=http://localhost:8000
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

## 🔌 Real-Time Communication

The backend uses Socket.io to emit real-time AI responses:

```javascript
// When AI generates a response
io.to(userId).emit("aiMessage", { 
  userMessage: query, 
  aiMessage: response.data.response 
});
```

## 📚 API Integration

The backend communicates with a Python AI service:
- **Endpoint:** `http://localhost:8000/query`
- **Request:** Sends query, model name, and thread ID
- **Response:** Returns AI-generated review or response

## 🔒 Security

- JWT-based authentication
- Request validation middleware
- Secure user ID extraction from authenticated tokens
- Error handling and logging

## 📝 Chat Controller

The chat controller handles two main operations:

### `addChat(req, res)`
- Validates user query and model name
- Generates unique thread ID
- Calls AI service for response
- Saves chat to database
- Emits real-time message via Socket.io

### `getHistory(req, res)`
- Retrieves all chat history for authenticated user
- Excludes sensitive fields
- Returns sorted conversation history

## 🐛 Error Handling

All endpoints include comprehensive error handling:
- 400: Bad Request (missing required fields)
- 401: Unauthorized (invalid token)
- 404: Not Found (no data)
- 500: Internal Server Error

## 📦 Dependencies

Key packages:
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `socket.io` - Real-time communication
- `axios` - HTTP client
- `uuid` - Unique ID generation
- `jsonwebtoken` - JWT authentication

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests.

## 📄 License

MIT License - feel free to use this project

---

**Made with ❤️ for better code reviews**
