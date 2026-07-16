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

  // Temporarily disable collaborator check since users don't have a githubLogin field yet
  // if (!(await isCollaborator(req.user.githubLogin, repo))) {
  //   return res.status(403).json({ message: "not authorized for this repo" });
  // }

  const reviews = await Review.find({ repoId: repo._id }).sort({ createdAt: -1 });
  res.json(
    reviews.map((r) => {
      const errorCount = r.findings.filter(f => f.severity === 'error').length;
      const warningCount = r.findings.filter(f => f.severity === 'warning').length;
      const infoCount = r.findings.filter(f => f.severity === 'info').length;

      return {
        prNumber: r.prNumber,
        prTitle: r.prTitle,
        prAuthor: r.prAuthor,
        createdAt: r.createdAt,
        status: r.status,
        findingCount: r.findings.length,
        hasBlocking: errorCount > 0,
        severityBreakdown: {
          error: errorCount,
          warning: warningCount,
          info: infoCount,
        }
      };
    })
  );
}

export const getRepoReview = async(req, res) => {
  const { owner, repo: repoName, number } = req.params;
  const repo = await Repo.findOne({ owner, name: repoName });
  if (!repo) return res.status(404).json({ message: "repo not connected" });

  // Temporarily disable collaborator check since users don't have a githubLogin field yet
  // if (!(await isCollaborator(req.user.githubLogin, repo))) {
  //   return res.status(403).json({ message: "not authorized for this repo" });
  // }

  const review = await Review.findOne({ repoId: repo._id, prNumber: Number(number) }).sort({ createdAt: -1 });
  if (!review) return res.status(404).json({ message: "no review found for this PR" });

  res.json(review);
}

export const getUserRepos = async (req, res) => {
  try {
    const reposWithReviews = await Review.aggregate([
      {
        $group: {
          _id: "$repoId",
          latestReviewDate: { $max: "$updatedAt" },
          attentionCount: {
            $sum: { $cond: [{ $gt: [{ $size: "$findings" }, 0] }, 1, 0] }
          }
        }
      },
      {
        $sort: { latestReviewDate: -1 }
      },
      {
        $lookup: {
          from: "repos",
          localField: "_id",
          foreignField: "_id",
          as: "repoDetails"
        }
      },
      {
        $unwind: "$repoDetails"
      },
      {
        $project: {
          _id: "$repoDetails._id",
          owner: "$repoDetails.owner",
          name: "$repoDetails.name",
          latestReviewDate: 1,
          attentionCount: 1,
          lastIndexedAt: "$repoDetails.updatedAt"
        }
      }
    ]);

    res.json(reposWithReviews);
  } catch (error) {
    console.error("Error fetching repos:", error);
    res.status(500).json({ message: "Failed to fetch repos" });
  }
};