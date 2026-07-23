import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  updateProfile,
  updatePreferences,
  getLinkedInstallations,
  disconnectInstallation,
  disconnectRepo,
  updateRepoPreferences,
} from "../controller/settings.controller.js";
import { standardLimiter, mutationLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.patch("/profile", protectRoute, standardLimiter, updateProfile);
router.patch("/preferences", protectRoute, standardLimiter, updatePreferences);
router.get("/github", protectRoute, standardLimiter, getLinkedInstallations);
router.post("/github/disconnect/:installationId", protectRoute, mutationLimiter, disconnectInstallation);
router.post("/repos/:owner/:repo/disconnect", protectRoute, mutationLimiter, disconnectRepo);
router.patch("/repos/:owner/:repo/preferences", protectRoute, standardLimiter, updateRepoPreferences);

export default router;
