import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/auth.route.js";
import chatRoutes from "./routes/chat.route.js";
import githubRoutes from "./routes/github.route.js";
import repoRoutes from "./routes/repo.route.js";
import activityRoutes from "./routes/activity.route.js";
import { connectdb } from "./lib/db.js";
import { Server } from "socket.io";
import { createServer } from "http";
import { QueueEvents } from "bullmq";
import { redisConnection } from "./lib/redisConnection.js";
import { requestLogger, errorLogger } from "./middleware/logger.middleware.js";
import logger from "./lib/logger.js";

// Supplementary uncaughtException handler.
// Winston natively catches, formats, and logs exceptions to our transports.
// Since we have `exitOnError: false` configured, Winston leaves the process alive.
// This enforces the hard exit 500ms later to give Winston time to flush the log.
process.on("uncaughtException", () => {
  setTimeout(() => process.exit(1), 500); 
});

const app = express();
dotenv.config();
const allowedOrigins = [
  "http://localhost:5173", //for development
  "https://starlit-stationary-frontend.vercel.app",
  "https://hatmind.vercel.app"
].filter(Boolean);

app.use(cookieParser());
app.use(requestLogger);
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
  logger.info(`Client connected: ${socket.id}`);

  socket.on("joinUserRoom", (userId) => {
    socket.join(userId);
    logger.info(`Socket ${socket.id} joined room ${userId}`);
  });

  socket.on("disconnect", () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Setup QueueEvents for real-time indexing progress
// QueueEvents MUST have its own dedicated Redis connection (BullMQ requirement)
import Redis from "ioredis";
const queueEventsConnection = new Redis(process.env.UPSTASH_REDIS_URL, {
  maxRetriesPerRequest: null,
});
const indexQueueEvents = new QueueEvents("index-repo", { connection: queueEventsConnection });
const reviewQueueEvents = new QueueEvents("review-pr", { connection: queueEventsConnection });
logger.info("[Server] QueueEvents listeners attached for index-repo and review-pr queues");

queueEventsConnection.on("error", (err) => {
  logger.warn(`QueueEvents Redis connection error: ${err.message}`);
});

indexQueueEvents.on("progress", ({ jobId, data }) => {
  logger.debug(`[QueueEvents] Progress event: jobId=${jobId}, progress=${data}`);
  io.emit("indexingProgress", { jobId, progress: data, status: "indexing" });
});
indexQueueEvents.on("completed", ({ jobId }) => {
  logger.info(`[QueueEvents] Completed event: jobId=${jobId}`);
  io.emit("indexingProgress", { jobId, progress: 100, status: "completed" });
  io.emit("dashboardUpdate", { type: "index_completed", jobId });
});
indexQueueEvents.on("failed", ({ jobId, failedReason }) => {
  logger.error(`[QueueEvents] Failed event: jobId=${jobId}, reason=${failedReason}`);
  io.emit("indexingProgress", { jobId, progress: 0, status: "failed", error: failedReason });
  io.emit("dashboardUpdate", { type: "index_failed", jobId });
});

reviewQueueEvents.on("active", ({ jobId }) => {
  logger.info(`[QueueEvents] Review started: jobId=${jobId}`);
  io.emit("dashboardUpdate", { type: "review_started", jobId });
});
reviewQueueEvents.on("completed", ({ jobId }) => {
  logger.info(`[QueueEvents] Review completed: jobId=${jobId}`);
  io.emit("dashboardUpdate", { type: "review_completed", jobId });
});

const PORT = process.env.PORT;

// IMPORTANT: mounted before express.json(). This route needs the raw request
// body untouched to verify GitHub's HMAC signature — its own router applies
// express.raw() internally. If the global json() parser ran first, it woul
// already have consumed and parsed the body, leaving nothing for raw() to read.
app.use("/api/github", githubRoutes);

app.use(express.json({ limit: "5mb" }));
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/repos", repoRoutes);
app.use("/api/activity", activityRoutes);

app.use(errorLogger);

server.listen(PORT, () => {
  logger.info(`The server is running on the port ${PORT}`);
  connectdb();
});