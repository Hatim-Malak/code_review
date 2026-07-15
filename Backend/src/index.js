import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/auth.route.js";
import chatRoutes from "./routes/chat.route.js";
import githubRoutes from "./routes/github.route.js";
import repoRoutes from "./routes/repo.route.js";
import { connectdb } from "./lib/db.js";
import { Server } from "socket.io";
import { createServer } from "http";
import SmeeClient from "smee-client";
import "./workers/reviewWorker.js";
import "./workers/indexedWorker.js";

const app = express();
dotenv.config();
const allowedOrigins = [
  "http://localhost:5173", //for development
  "https://starlit-stationary-frontend.vercel.app",
];

app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow non-browser tools like Postman, and GitHub's webhook (no Origin header)
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.locals.io = io;
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("joinUserRoom", (userId) => {
    socket.join(userId);
    console.log(`Socket ${socket.id} joined room ${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT;

// IMPORTANT: mounted before express.json(). This route needs the raw request
// body untouched to verify GitHub's HMAC signature — its own router applies
// express.raw() internally. If the global json() parser ran first, it would
// already have consumed and parsed the body, leaving nothing for raw() to read.
app.use("/api/github", githubRoutes);

app.use(express.json({ limit: "5mb" }));
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/repos", repoRoutes);

server.listen(PORT, () => {
  console.log("The server is running on the port ", PORT);
  connectdb();

  // Start Smee webhook forwarder in development
  if (process.env.NODE_ENV === "development") {
    const smee = new SmeeClient({
      source: "https://smee.io/JpNYi61dUBqjZCeh",
      target: `http://localhost:${PORT}/api/github/webhook`,
      logger: console
    });
    smee.start();
  }
});