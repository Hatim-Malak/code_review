import express from "express";
import { logout,signup,login,check, changePassword, deleteAccount, refresh, forgotPassword, resetPassword, requestSignupOtp } from "../controller/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { authLimiter, mutationLimiter, standardLimiter, otpLimiter } from "../middleware/rateLimiter.js";
const router = express.Router();

router.post("/request-signup-otp", otpLimiter, requestSignupOtp)
router.post("/signup", authLimiter, signup)
router.post("/login", authLimiter, login)
router.post("/logout", logout)
router.get("/check", protectRoute, standardLimiter, check)

router.patch("/change-password", protectRoute, mutationLimiter, changePassword)
router.delete("/delete-account", protectRoute, mutationLimiter, deleteAccount)

router.get("/refresh", standardLimiter, refresh);
router.post("/forgot-password", otpLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

export default router;