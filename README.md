# 🚀 Code Review Website

> An intelligent AI-powered code review platform with real-time collaboration, supporting multiple AI models for comprehensive code analysis and feedback

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-v16+-brightgreen.svg)
![Python](https://img.shields.io/badge/python-3.8+-blue.svg)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Project](#running-the-project)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)

## 🎯 Overview

Code Review Website is a full-stack web application that leverages AI technology to provide intelligent, real-time code reviews. Users can upload code snippets, select from multiple AI models, and receive detailed feedback and suggestions for improvement.

The platform features:
- 🔐 Secure user authentication
- 💬 Real-time WebSocket communication
- 🤖 Multiple AI model support
- 📚 Persistent chat history
- 🎨 Modern, responsive UI
- ⚡ High-performance backend

## ✨ Key Features

### 🤖 AI-Powered Code Review
- Support for multiple AI models (GPT-4, Claude, etc.)
- Intelligent code analysis and suggestions
- Context-aware feedback
- Multi-language support

### 💬 Real-Time Communication
- WebSocket-powered instant messaging
- Live AI response streaming
- Notification system
- Conversation persistence

### 🔐 Security & Authentication
- JWT-based authentication
- Secure password hashing
- Protected API endpoints
- User session management

### 📱 Responsive Design
- Mobile-friendly interface
- Modern dark/light theme support
- Smooth animations
- Accessible UI components

### 📊 User Management
- User registration and login
- Profile management
- Chat history tracking
- Usage analytics

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│                    (Vite + TypeScript + Tailwind)            │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/WebSocket
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js)                         │
│              (Express + MongoDB + Socket.io)                 │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                   AI Service (Python)                        │
│           (FastAPI/Flask + LLM Integration)                  │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
code-review-website/
│
├── Frontend/                    # React + Vite Frontend Application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components
│   │   ├── store/              # State management
│   │   ├── lib/                # Utilities and API clients
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/                 # Static assets
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── Backend/                     # Node.js Express Backend
│   ├── src/
│   │   ├── controller/         # Request handlers
│   │   │   ├── auth.controller.js
│   │   │   └── chat.controller.js
│   │   ├── models/             # Database schemas
│   │   │   ├── user.model.js
│   │   │   └── chat.model.js
│   │   ├── routes/             # API routes
│   │   │   ├── auth.route.js
│   │   │   └── chat.route.js
│   │   ├── middleware/         # Express middleware
│   │   │   └── auth.middleware.js
│   │   ├── lib/                # Helpers and utilities
│   │   │   ├── db.js
│   │   │   └── util.js
│   │   └── index.js            # Server entry point
│   ├── package.json
│   └── README.md
│
├── ai/                         # Python AI Service
│   ├── main.py                # FastAPI application
│   ├── python/                # Python modules
│   ├── pyproject.toml
│   ├── requirement.txt
│   └── README.md
│
└── README.md                   # This file
```

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18+
- **Build Tool:** Vite
- **Language:** TypeScript/JavaScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **HTTP Client:** Axios
- **Real-Time:** Socket.io Client

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB
- **Real-Time:** Socket.io
- **Authentication:** JWT (jsonwebtoken)
- **HTTP Client:** Axios
- **ID Generation:** UUID

### AI Service
- **Framework:** FastAPI / Flask
- **Language:** Python 3.8+
- **LLM Integration:** OpenAI API / Hugging Face
- **Dependencies:** Listed in `requirement.txt`

## 📦 Installation

### Prerequisites
- **Node.js** v16 or higher
- **Python** 3.8 or higher
- **MongoDB** (local or cloud)
- **Git**

### Clone Repository
```bash
git clone https://github.com/yourusername/code-review-website.git
cd code-review-website
```

### Install Frontend Dependencies
```bash
cd Frontend
npm install
```

### Install Backend Dependencies
```bash
cd ../Backend
npm install
```

### Install AI Service Dependencies
```bash
cd ../ai
pip install -r requirement.txt
```

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/codereview

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRATION=7d

# AI Service
AI_SERVICE_URL=http://localhost:8000

# CORS
CORS_ORIGIN=http://localhost:5173
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
```

#### AI Service (.env)
```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4
PORT=8000
```

## 🚀 Running the Project

### Start MongoDB
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or if installed locally
mongod
```

### Start AI Service
```bash
cd ai
python main.py
```

The AI service will be available at `http://localhost:8000`

### Start Backend Server
```bash
cd Backend
npm start
# or for development with auto-reload
npm run dev
```

The backend will be available at `http://localhost:5000`

### Start Frontend Development Server
```bash
cd Frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Access the Application
Open your browser and navigate to:
```
http://localhost:5173
```

## 📡 API Documentation

### Authentication Endpoints

#### Register User
```
POST /api/auth/signup
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123"
}

Response: 200 OK
{
  "token": "jwt_token_here",
  "user": {
    "_id": "...",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

#### Login User
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}

Response: 200 OK
{
  "token": "jwt_token_here",
  "user": { ... }
}
```

### Chat Endpoints

#### Add Chat Message
```
POST /api/chat/add
Authorization: Bearer {token}
Content-Type: application/json

{
  "query": "Review this code for security issues",
  "model_name": "gpt-4"
}

Response: 200 OK
{
  "response": "AI review response with detailed feedback..."
}
```

#### Get Chat History
```
GET /api/chat/history
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "_id": "...",
    "user_message": "Review this code...",
    "AI_message": "AI response...",
    "createdAt": "2026-01-31T..."
  }
]
```

## 🔐 Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ CORS protection
- ✅ Input validation and sanitization
- ✅ Rate limiting (recommended)
- ✅ Secure session management
- ✅ Environment variable protection

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/code-review-website.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```

4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```

5. **Open a Pull Request**

## 📝 Code Style

- Use ESLint for JavaScript/TypeScript
- Follow PEP 8 for Python code
- Use meaningful variable and function names
- Add comments for complex logic
- Write unit tests for new features

## 🐛 Known Issues & Roadmap

### Planned Features
- [ ] Support for more AI models
- [ ] Code diff visualization
- [ ] Team collaboration features
- [ ] Code snippet sharing
- [ ] Advanced analytics dashboard
- [ ] Browser extensions
- [ ] API rate limiting

### Known Issues
- None currently reported

## 📞 Support

For issues, questions, or suggestions:
- 📧 Email: support@codereview.com
- 🐛 GitHub Issues: [Report a bug](https://github.com/yourusername/code-review-website/issues)
- 💬 Discussions: [Join our community](https://github.com/yourusername/code-review-website/discussions)

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with ❤️ by the development team
- Thanks to all contributors
- Powered by OpenAI and modern web technologies

---

<div align="center">

**[⬆ back to top](#-code-review-website)**

Made with 💻 and ☕ by developers, for developers

</div>
