import Activity from "../models/activity.model.js";
import Repo from "../models/repo.model.js";
import Review from "../models/review.model.js";
import Installation from "../models/installation.model.js";

const repoCache = new Map();
const CACHE_TTL = 10000; // 10 seconds cache to optimize performance

async function getRepoIdsForUser(userId) {
  const now = Date.now();
  const cached = repoCache.get(userId.toString());
  if (cached && cached.expiresAt > now) {
    return cached.repoIds;
  }

  const userInstallations = await Installation.find({ userId });
  const validInstallationIds = userInstallations.map(i => i.installationId);
  const repos = await Repo.find({ installationId: { $in: validInstallationIds } });
  const repoIds = repos.map(r => r._id);

  repoCache.set(userId.toString(), {
    repoIds,
    expiresAt: now + CACHE_TTL
  });

  return repoIds;
}

export const getActivityFeed = async (req, res, next) => {
  try {
    const repoIds = await getRepoIdsForUser(req.user._id);

    // Fetch recent activity
    const activities = await Activity.find({ repoId: { $in: repoIds } })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("repoId", "owner name");

    // Compute stats
    const totalRepos = repoIds.length;

    // Calculate dates
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Using aggregation to sum finding counts and determine clean vs attention reviews
    const statsResult = await Review.aggregate([
      { $match: { repoId: { $in: repoIds } } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          reviewsThisWeek: {
            $sum: {
              $cond: [{ $gte: ["$createdAt", oneWeekAgo] }, 1, 0]
            }
          },
          totalFindings: {
            $sum: { $size: { $ifNull: ["$findings", []] } }
          },
          cleanReviews: {
            $sum: {
              $cond: [{ $eq: [{ $size: { $ifNull: ["$findings", []] } }, 0] }, 1, 0]
            }
          },
          attentionReviews: {
            $sum: {
              $cond: [{ $gt: [{ $size: { $ifNull: ["$findings", []] } }, 0] }, 1, 0]
            }
          }
        }
      }
    ]);

    const statsData = statsResult.length > 0 ? statsResult[0] : { totalReviews: 0, reviewsThisWeek: 0, totalFindings: 0, cleanReviews: 0, attentionReviews: 0 };

    res.json({
      activities,
      stats: {
        totalRepos,
        totalReviews: statsData.totalReviews,
        reviewsThisWeek: statsData.reviewsThisWeek,
        totalFindings: statsData.totalFindings,
        cleanReviews: statsData.cleanReviews,
        attentionReviews: statsData.attentionReviews
      }
    });
  } catch (error) {
    next(error);
  }
};
