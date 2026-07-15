// Backend/src/routes/repo.route.js
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getRepoPRs, getRepoReview, getUserRepos } from "../controller/repo.controller.js";

const router = express.Router();

router.get("/", protectRoute, getUserRepos);
router.get("/:owner/:repo/prs", protectRoute, getRepoPRs);
router.get("/:owner/:repo/pr/:number", protectRoute, getRepoReview);

export default router;