// Backend/src/routes/repo.route.js
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getRepoPRs, getRepoReview, getUserRepos, toggleFindingResolve, reRunReview, getIndexingStatus, handleAiReviewWebhook,fullyUninstall, mergePR } from "../controller/repo.controller.js";
import { standardLimiter, mutationLimiter, webhookLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.get("/", protectRoute, standardLimiter, getUserRepos);
router.get("/indexing-status", protectRoute, standardLimiter, getIndexingStatus);
router.get("/:owner/:repo/prs", protectRoute, standardLimiter, getRepoPRs);
router.get("/:owner/:repo/pr/:number", protectRoute, standardLimiter, getRepoReview);
router.patch("/:owner/:repo/pr/:number/finding/:findingId", protectRoute, standardLimiter, toggleFindingResolve);
router.post("/:owner/:repo/pr/:number/rerun", protectRoute, mutationLimiter, reRunReview);
router.post("/:owner/:repo/pr/:number/merge", protectRoute, mutationLimiter, mergePR);

// Internal AI webhook - secured via AI_CALLBACK_SECRET in the controller
router.post("/internal/ai-webhook", webhookLimiter, handleAiReviewWebhook);
// Backend/src/routes/repo.route.js
router.delete("/:owner/:repo/uninstall", protectRoute, mutationLimiter, fullyUninstall);

export default router;