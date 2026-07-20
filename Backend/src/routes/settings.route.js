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

const router = express.Router();

router.patch("/profile", protectRoute, updateProfile);
router.patch("/preferences", protectRoute, updatePreferences);
router.get("/github", protectRoute, getLinkedInstallations);
router.post("/github/disconnect/:installationId", protectRoute, disconnectInstallation);
router.post("/repos/:owner/:repo/disconnect", protectRoute, disconnectRepo);
router.patch("/repos/:owner/:repo/preferences", protectRoute, updateRepoPreferences);

export default router;
