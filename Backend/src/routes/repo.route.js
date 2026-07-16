// Backend/src/routes/repo.route.js
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getRepoPRs, getRepoReview, getUserRepos, toggleFindingResolve, reRunReview, getIndexingStatus } from "../controller/repo.controller.js";

const router = express.Router();

router.get("/", protectRoute, getUserRepos);
router.get("/indexing-status", protectRoute, getIndexingStatus);
router.get("/:owner/:repo/prs", protectRoute, getRepoPRs);
router.get("/:owner/:repo/pr/:number", protectRoute, getRepoReview);
router.patch("/:owner/:repo/pr/:number/finding/:findingId", protectRoute, toggleFindingResolve);
router.post("/:owner/:repo/pr/:number/rerun", protectRoute, reRunReview);

export default router;