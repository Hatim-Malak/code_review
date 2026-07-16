// Backend/src/models/review.model.js
import mongoose from "mongoose";

const findingSchema = new mongoose.Schema(
  {
    file: String,
    startLine: Number,
    endLine: Number,
    severity: { type: String, enum: ["info", "warning", "error"] },
    comment: String,
    suggestedFix: String,
    rag_sources: [String],
  },
  { _id: false },
);

const reviewSchema = new mongoose.Schema(
  {
    repoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Repo",
      required: true,
    },
    prNumber: Number,
    prTitle: String,
    prAuthor: {
      name: String,
      avatarUrl: String,
    },
    headSha: String,
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "failed"],
      default: "pending",
    },
    findings: [findingSchema],
  },
  { timestamps: true },
);

export default mongoose.model("Review", reviewSchema);
