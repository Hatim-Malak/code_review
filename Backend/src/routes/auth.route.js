import express from "express";
import { logout,signup,login,check, changePassword, deleteAccount } from "../controller/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
const router = express.Router();

router.post("/signup",signup)
router.post("/login",login)
router.post("/logout",logout)
router.get("/check",protectRoute,check)

router.patch("/change-password", protectRoute, changePassword)
router.delete("/delete-account", protectRoute, deleteAccount)

export default router;