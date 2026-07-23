import express from "express";
import { logout,signup,login,check, changePassword, deleteAccount } from "../controller/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { authLimiter, mutationLimiter, standardLimiter } from "../middleware/rateLimiter.js";
const router = express.Router();

router.post("/signup", authLimiter, signup)
router.post("/login", authLimiter, login)
router.post("/logout", logout)
router.get("/check", protectRoute, standardLimiter, check)

router.patch("/change-password", protectRoute, mutationLimiter, changePassword)
router.delete("/delete-account", protectRoute, mutationLimiter, deleteAccount)

export default router;