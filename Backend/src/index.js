import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/auth.route.js";
import chatRoutes from "./routes/chat.route.js";
import { connectdb } from "./lib/db.js";
import { Server } from "socket.io";
import { createServer } from "http";

const app = express();
dotenv.config();
const allowedOrigins = [
  "http://localhost:5173", //for development
  "https://starlit-stationary-frontend.vercel.app",
  "http://127.0.0.1:8000",
];

app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow non-browser tools like Postman
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

app.use(express.json({ limit: "5mb" }));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
server.listen(PORT, () => {
  console.log("The server is running on the port ", PORT);
  connectdb();
});
