import express from "express";
import { handleWbhook, linkInstallation } from "../controller/github.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { webhookLimiter, mutationLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/webhook", webhookLimiter, express.raw({ type: "application/json" }), handleWbhook);
router.post("/link-installation", protectRoute, mutationLimiter, express.json(), linkInstallation);

export default router