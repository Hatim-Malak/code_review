import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getNotifications, markAsRead, markAllAsRead } from "../controller/notification.controller.js";
import { standardLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.get("/", protectRoute, standardLimiter, getNotifications);
router.patch("/read-all", protectRoute, standardLimiter, markAllAsRead);
router.patch("/:id/read", protectRoute, standardLimiter, markAsRead);

export default router;
