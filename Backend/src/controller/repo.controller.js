// Backend/src/controller/repo.controller.js
import Repo from "../models/repo.model.js";
import Review from "../models/review.model.js";
import { octokitForInstallation } from "../lib/githubAuth.js";

const isCollaborator = async(githubLogin, repo) => {
  if (!githubLogin) return false;
  try {
    const octokit = octokitForInstallation(repo.installationId);
    await octokit.repos.checkCollaborator({
      owner: repo.owner,
      repo: repo.name,
      username: githubLogin,
    });
    return true; 
  } catch (err) {
    if (err.status === 404) return false; 
    throw err;
  }
}

export const getRepoPRs = async(req, res) => {
  const { owner, repo: repoName } = req.params;
  const repo = await Repo.findOne({ owner, name: repoName });
  if (!repo) return res.status(404).json({ message: "repo not connected" });

  if (!(await isCollaborator(req.user.githubLogin, repo))) {
    return res.status(403).json({ message: "not authorized for this repo" });
  }

  const reviews = await Review.find({ repoId: repo._id }).sort({ createdAt: -1 });
  res.json(
    reviews.map((r) => ({
      prNumber: r.prNumber,
      status: r.status,
      findingCount: r.findings.length,
      hasBlocking: r.findings.some((f) => f.severity === "error"),
    }))
  );
}

export const getRepoReview = async(req, res) => {
  const { owner, repo: repoName, number } = req.params;
  const repo = await Repo.findOne({ owner, name: repoName });
  if (!repo) return res.status(404).json({ message: "repo not connected" });

  if (!(await isCollaborator(req.user.githubLogin, repo))) {
    return res.status(403).json({ message: "not authorized for this repo" });
  }

  const review = await Review.findOne({ repoId: repo._id, prNumber: Number(number) }).sort({ createdAt: -1 });
  if (!review) return res.status(404).json({ message: "no review found for this PR" });

  res.json(review);
}