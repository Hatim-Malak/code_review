// Backend/src/controller/repo.controller.js
import Repo from "../models/repo.model.js";
import Review from "../models/review.model.js";
import Installation from "../models/installation.model.js";
import { octokitForInstallation } from "../lib/githubAuth.js";
import { reviewQueue } from "../lib/queue.js";
import Activity from "../models/activity.model.js";
import { postCheckRun } from "../lib/githubChecks.js";
import logger from "../lib/logger.js";
import { uninstallApp } from "../lib/githubAuth.js"
import User from "../models/user.model.js";
import { dispatchReviewNotification } from "../lib/notification.service.js";


const SEVERITY_RANK = { info: 0, warning: 1, error: 2 };

const resolveMinSeverity = async (repo) => {
  if (repo.reviewPreferences?.minSeverity) return repo.reviewPreferences.minSeverity;
  if (repo.claimedByUserId) {
    const owner = await User.findById(repo.claimedByUserId).select("preferences");
    return owner?.preferences?.review?.defaultMinSeverity || "info";
  }
  return "info";
};


const isCollaborator = async (githubLogin, repo) => {
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

export const getRepoPRs = async (req, res, next) => {
  try {
    const { owner, repo: repoName } = req.params;
    const repo = await Repo.findOne({ owner, name: repoName });
    if (!repo) return res.status(404).json({ message: "repo not connected" });

    // Ensure the user owns this repo's installation
    const installation = await Installation.findOne({ installationId: repo.installationId, userId: req.user._id });
    if (!installation) {
      return res.status(403).json({ message: "not authorized for this repo" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ repoId: repo._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
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
  } catch (err) {
    next(err);
  }
}

export const getRepoReview = async (req, res, next) => {
  try {
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
  } catch (err) {
    next(err);
  }
}

export const getUserRepos = async (req, res, next) => {
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
          lastIndexedAt: "$repoDetails.updatedAt",
          reviewPreferences: "$repoDetails.reviewPreferences"
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
    next(error);
  }
};

export const toggleFindingResolve = async (req, res, next) => {
  try {
    const { owner, repo: repoName, number, findingId } = req.params;
    const { resolved } = req.body;

    const repo = await Repo.findOne({ owner, name: repoName });
    if (!repo) return res.status(404).json({ message: "repo not connected" });

    // Ensure the user owns this repo's installation
    const installation = await Installation.findOne({ installationId: repo.installationId, userId: req.user._id });
    if (!installation) {
      return res.status(403).json({ message: "not authorized for this repo" });
    }

    const review = await Review.findOne({ repoId: repo._id, prNumber: Number(number) });
    if (!review) return res.status(404).json({ message: "no review found for this PR" });

    const finding = review.findings.id(findingId);
    if (!finding) return res.status(404).json({ message: "finding not found" });

    finding.resolved = resolved;
    await review.save();

    res.json({ message: "Finding updated", finding });
  } catch (error) {
    next(error);
  }
};

export const reRunReview = async (req, res, next) => {
  try {
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
    next(error);
  }
};

export const getIndexingStatus = async (req, res, next) => {
  try {
    const userInstallations = await Installation.find({ userId: req.user._id });
    const validInstallationIds = userInstallations.map(i => i.installationId);

    const total = await Repo.countDocuments({ installationId: { $in: validInstallationIds } });
    const indexed = await Repo.countDocuments({ installationId: { $in: validInstallationIds }, lastIndexedSha: { $ne: null } });
    res.json({ total, indexed, progress: total > 0 ? Math.round((indexed / total) * 100) : 0 });
  } catch (error) {
    next(error);
  }
};

export const handleAiReviewWebhook = async (req, res, next) => {
  try {
    const expectedSecret = process.env.AI_CALLBACK_SECRET || "default_secret_for_dev";
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { repoId, prNumber, headSha } = req.query;
    const { findings, rag_sources } = req.body;

    if (!repoId || !prNumber || !headSha) {
      return res.status(400).json({ message: "Missing required query params" });
    }

    const repo = await Repo.findById(repoId);
    if (!repo) return res.status(404).json({ message: "Repo not found" });
    const minSeverity = await resolveMinSeverity(repo);
    const filteredFindings = findings.filter(
      f => SEVERITY_RANK[f.severity] >= SEVERITY_RANK[minSeverity]
    );

    const review = await Review.findOne({ repoId: repo._id, prNumber: Number(prNumber) });
    if (!review) return res.status(404).json({ message: "Review not found" });

    // Merge findings to preserve resolved state
    const mergedFindings = filteredFindings.map(newF => {
      const existingF = review.findings.find(oldF =>
        oldF.file === newF.file &&
        oldF.startLine === newF.startLine &&
        oldF.endLine === newF.endLine &&
        oldF.comment === newF.comment
      );
      if (existingF) {
        return { ...newF, _id: existingF._id, resolved: existingF.resolved };
      }
      return newF;
    });

    review.findings = mergedFindings;
    review.status = "completed";
    await review.save();

    await Activity.create({
      type: filteredFindings.length === 0 ? "pr_merged_clean" : "review_completed",
      repoId: repo._id,
      prNumber: Number(prNumber),
      message: filteredFindings.length === 0
        ? `PR #${prNumber} passed review with 0 findings`
        : `Completed review for PR #${prNumber} with ${filteredFindings.length} finding(s)`
    });

    const octokit = octokitForInstallation(repo.installationId);
    await postCheckRun(octokit, repo, headSha, { status: "completed", findings: filteredFindings });
    
    await dispatchReviewNotification(repo, Number(prNumber), filteredFindings, null, req.app.locals.io);

    if (repo.claimedByUserId) {
      req.app.locals.io.to(repo.claimedByUserId.toString()).emit("dashboardUpdate", { 
        type: "review_completed", 
        prNumber: Number(prNumber) 
      });
    }

    res.status(200).json({ message: "Webhook processed successfully" });
  } catch (error) {
    next(error);
  }
};

export async function fullyUninstall(req, res, next) {
  try {
    const { owner, repo: repoName } = req.params;
    const repo = await Repo.findOne({ owner, name: repoName });
    if (!repo) return res.status(404).json({ message: "repo not found" });

    if (String(repo.claimedByUserId) !== String(req.user._id)) {
      return res.status(403).json({ message: "only the connecting user can uninstall this" });
    }

    try {
      await uninstallApp(repo.installationId);
    } catch (uninstallError) {
      logger.error(`Failed to uninstall from GitHub API: ${uninstallError.message || uninstallError}`);
    }

    try {
      await fetch(`${process.env.AI_SERVICES_URL}/delete_namespace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namespace: repo.namespace }),
      });
    } catch (err) {
      logger.error(`Failed to delete namespace in AI service: ${err.message || err}`);
    }

    await repo.deleteOne();

    res.json({ message: "uninstalled" });
  } catch (error) {
    next(error);
  }
}