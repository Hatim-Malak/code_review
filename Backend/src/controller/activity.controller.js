import Activity from "../models/activity.model.js";
import Repo from "../models/repo.model.js";
import Review from "../models/review.model.js";
import Installation from "../models/installation.model.js";

export const getActivityFeed = async (req, res, next) => {
  try {
    const userInstallations = await Installation.find({ userId: req.user._id });
    const validInstallationIds = userInstallations.map(i => i.installationId);
    
    // Find repos belonging to the user's installations
    const repos = await Repo.find({ installationId: { $in: validInstallationIds } });
    const repoIds = repos.map(r => r._id);

    // Fetch recent activity
    const activities = await Activity.find({ repoId: { $in: repoIds } })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("repoId", "owner name");

    // Compute stats
    const totalRepos = repoIds.length;
    const totalReviews = await Review.countDocuments({ repoId: { $in: repoIds } });
    
    // Calculate dates
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const reviewsThisWeek = await Review.countDocuments({ 
      repoId: { $in: repoIds },
      createdAt: { $gte: oneWeekAgo }
    });

    // Using aggregation to sum finding counts and determine clean vs attention reviews
    const findingsResult = await Review.aggregate([
      { $match: { repoId: { $in: repoIds } } },
      { $project: { 
          findingCount: { $size: { $ifNull: ["$findings", []] } } 
        } 
      },
      { $group: { 
          _id: null, 
          totalFindings: { $sum: "$findingCount" },
          cleanReviews: {
            $sum: { $cond: [{ $eq: ["$findingCount", 0] }, 1, 0] }
          },
          attentionReviews: {
            $sum: { $cond: [{ $gt: ["$findingCount", 0] }, 1, 0] }
          }
        } 
      }
    ]);
    
    const statsData = findingsResult.length > 0 ? findingsResult[0] : { totalFindings: 0, cleanReviews: 0, attentionReviews: 0 };

    res.json({
      activities,
      stats: {
        totalRepos,
        totalReviews,
        reviewsThisWeek,
        totalFindings: statsData.totalFindings,
        cleanReviews: statsData.cleanReviews,
        attentionReviews: statsData.attentionReviews
      }
    });
  } catch (error) {
    next(error);
  }
};
