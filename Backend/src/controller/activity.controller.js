import Activity from "../models/activity.model.js";
import Repo from "../models/repo.model.js";
import Review from "../models/review.model.js";

export const getActivityFeed = async (req, res) => {
  try {
    // In a real app we'd filter by req.user's repos.
    // Since we don't have user scoped repos yet, we fetch all repos.
    const repos = await Repo.find({});
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
    console.error("Error fetching activity feed:", error);
    res.status(500).json({ message: "Failed to fetch activity feed" });
  }
};
