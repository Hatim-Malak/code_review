import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getActivityFeed } from "../controller/activity.controller.js";

const router = express.Router();

router.get("/", protectRoute, getActivityFeed);

export default router;
