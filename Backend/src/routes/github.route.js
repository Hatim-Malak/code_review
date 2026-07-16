import express from "express";
import { handleWbhook, linkInstallation } from "../controller/github.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/webhook",express.raw({ type: "application/json" }), handleWbhook);
router.post("/link-installation", protectRoute, express.json(), linkInstallation);

export default router