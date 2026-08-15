import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["review_started", "review_completed", "review_failed", "reindexed", "pr_merged_clean", "pr_merged"],
      required: true,
    },
    repoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Repo",
      required: true,
    },
    prNumber: {
      type: Number,
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

activitySchema.index({ repoId: 1, createdAt: -1 });
activitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model("Activity", activitySchema);
