import express from "express"
import { addChat, getHistory, getSessions, deleteSession } from "../controller/chat.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { chatLimiter, standardLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/add_chat", protectRoute, chatLimiter, addChat)
router.get("/history", protectRoute, standardLimiter, getHistory)
router.get("/sessions", protectRoute, standardLimiter, getSessions)
router.delete("/session/:converId", protectRoute, standardLimiter, deleteSession)

export default router;