// Backend/src/controller/repo.controller.js
import Repo from "../models/repo.model.js";
import Review from "../models/review.model.js";
import Installation from "../models/installation.model.js";
import { octokitForInstallation } from "../lib/githubAuth.js";
import { reviewQueue } from "../lib/queue.js";

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

  // Ensure the user owns this repo's installation
  const installation = await Installation.findOne({ installationId: repo.installationId, userId: req.user._id });
  if (!installation) {
    return res.status(403).json({ message: "not authorized for this repo" });
  }

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

  // Ensure the user owns this repo's installation
  const installation = await Installation.findOne({ installationId: repo.installationId, userId: req.user._id });
  if (!installation) {
    return res.status(403).json({ message: "not authorized for this repo" });
  }

  const review = await Review.findOne({ repoId: repo._id, prNumber: Number(number) }).sort({ createdAt: -1 });
  if (!review) return res.status(404).json({ message: "no review found for this PR" });

  const errorCount = review.findings.filter(f => f.severity === 'error').length;
  const warningCount = review.findings.filter(f => f.severity === 'warning').length;
  const infoCount = review.findings.filter(f => f.severity === 'info').length;

  const reviewObj = review.toObject();
  reviewObj.severityBreakdown = {
    error: errorCount,
    warning: warningCount,
    info: infoCount,
  };

  res.json(reviewObj);
}

export const getUserRepos = async (req, res) => {
  try {
    const userInstallations = await Installation.find({ userId: req.user._id });
    const validInstallationIds = userInstallations.map(i => i.installationId);
    
    // First, find all repos the user owns
    const userRepos = await Repo.find({ installationId: { $in: validInstallationIds } });
    const userRepoIds = userRepos.map(r => r._id);

    const reposWithReviews = await Review.aggregate([
      {
        $match: { repoId: { $in: userRepoIds } }
      },
      {
        $group: {
          _id: "$repoId",
          latestReviewDate: { $max: "$updatedAt" },
          attentionCount: {
            $sum: {
              $size: {
                $filter: {
                  input: { $ifNull: ["$findings", []] },
                  as: "f",
                  cond: { $ne: ["$$f.resolved", true] }
                }
              }
            }
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

    // Merge with userRepos to ensure repos with 0 reviews are still shown
    const reposWithReviewsMap = new Map(reposWithReviews.map(r => [r._id.toString(), r]));
    
    const allUserRepos = userRepos.map(repo => {
      const reviewData = reposWithReviewsMap.get(repo._id.toString());
      return {
        _id: repo._id,
        owner: repo.owner,
        name: repo.name,
        latestReviewDate: reviewData ? reviewData.latestReviewDate : repo.updatedAt,
        attentionCount: reviewData ? reviewData.attentionCount : 0,
        lastIndexedAt: repo.lastIndexedSha ? repo.updatedAt : null
      };
    }).sort((a, b) => new Date(b.latestReviewDate) - new Date(a.latestReviewDate));

    res.json(allUserRepos);
  } catch (error) {
    console.error("Error fetching repos:", error);
    res.status(500).json({ message: "Failed to fetch repos" });
  }
};

export const toggleFindingResolve = async (req, res) => {
  try {
    const { owner, repo: repoName, number, findingId } = req.params;
    const { resolved } = req.body;

    const repo = await Repo.findOne({ owner, name: repoName });
    if (!repo) return res.status(404).json({ message: "repo not connected" });

    const review = await Review.findOne({ repoId: repo._id, prNumber: Number(number) });
    if (!review) return res.status(404).json({ message: "no review found for this PR" });

    const finding = review.findings.id(findingId);
    if (!finding) return res.status(404).json({ message: "finding not found" });

    finding.resolved = resolved;
    await review.save();

    res.json({ message: "Finding updated", finding });
  } catch (error) {
    console.error("Error toggling resolve:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const reRunReview = async (req, res) => {
  try {
    const { owner, repo: repoName, number } = req.params;
    const repo = await Repo.findOne({ owner, name: repoName });
    if (!repo) return res.status(404).json({ message: "repo not connected" });

    const review = await Review.findOne({ repoId: repo._id, prNumber: Number(number) }).sort({ createdAt: -1 });
    if (!review) return res.status(404).json({ message: "no review found for this PR" });

    review.status = "in_progress";
    await review.save();

    await reviewQueue.add("review-pr", {
      repoId: repo._id,
      installationId: repo.installationId,
      prNumber: Number(number),
      headSha: review.headSha, // Strictly use the DB-stored headSha as requested
    });

    res.json({ message: "Review job re-queued" });
  } catch (error) {
    console.error("Error re-running review:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getIndexingStatus = async (req, res) => {
  try {
    const userInstallations = await Installation.find({ userId: req.user._id });
    const validInstallationIds = userInstallations.map(i => i.installationId);

    const total = await Repo.countDocuments({ installationId: { $in: validInstallationIds } });
    const indexed = await Repo.countDocuments({ installationId: { $in: validInstallationIds }, lastIndexedSha: { $ne: null } });
    res.json({ total, indexed, progress: total > 0 ? Math.round((indexed / total) * 100) : 0 });
  } catch (error) {
    console.error("Error fetching indexing status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};