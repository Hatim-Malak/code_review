import express from "express"
import { addChat,getHistory } from "../controller/chat.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/add_chat",protectRoute,addChat)
router.get("/history",protectRoute,getHistory)

export default router;