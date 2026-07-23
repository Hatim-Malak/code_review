import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getActivityFeed } from "../controller/activity.controller.js";
import { standardLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.get("/", protectRoute, standardLimiter, getActivityFeed);

export default router;
