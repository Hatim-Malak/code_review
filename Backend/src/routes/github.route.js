import express from "express";
import { handleWbhook } from "../controller/github.controller.js";

const router = express.Router();

router.post("/webhook",express.raw({ type: "application/json" }), handleWebhook);

export default router