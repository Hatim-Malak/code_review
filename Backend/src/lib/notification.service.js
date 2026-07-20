import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import logger from "./logger.js";

const buildCompletedNotification = (repo, prNumber, errorCount, warningCount, infoCount) => {
  return {
    type: "review_completed",
    title: `Review Completed: PR #${prNumber}`,
    message: `Review finished with ${errorCount} errors, ${warningCount} warnings, and ${infoCount} infos.`,
    metadata: {
      repoId: repo._id,
      owner: repo.owner,
      repoName: repo.name,
      prNumber: prNumber
    }
  };
};

const buildAttentionNotification = (repo, prNumber, errorCount, warningCount) => {
  return {
    type: "findings_attention",
    title: `Attention Needed: PR #${prNumber}`,
    message: `Found ${errorCount} errors and ${warningCount} warnings that require your attention.`,
    metadata: {
      repoId: repo._id,
      owner: repo.owner,
      repoName: repo.name,
      prNumber: prNumber
    }
  };
};

const buildFailedNotification = (repo, prNumber, reason) => {
  return {
    type: "review_failed",
    title: `Review Failed: PR #${prNumber}`,
    message: `The review could not be completed. Reason: ${reason}`,
    metadata: {
      repoId: repo._id,
      owner: repo.owner,
      repoName: repo.name,
      prNumber: prNumber
    }
  };
};

const deliver = async (preference, user, notificationData, io = null) => {
  if (preference === "none") return;

  if (preference === "in_app" || preference === "email") {
    // Save to DB
    const notification = await Notification.create({
      userId: user._id,
      ...notificationData
    });

    // Emit real-time if IO is provided
    if (io) {
      io.to(user._id.toString()).emit("newNotification", notification);
    }

    if (preference === "email") {
      // Mock email delivery for now
      logger.warn(`Email delivery is not yet configured (Nodemailer missing). Falling back to in-app notification for ${user.email}`);
    }
  }
};

export const dispatchReviewNotification = async (repo, prNumber, filteredFindings, preFetchedUser = null, io = null) => {
  if (!repo?.claimedByUserId) return;
  const user = preFetchedUser || await User.findById(repo.claimedByUserId).select("preferences email");
  if (!user) return;

  const errorCount = filteredFindings.filter(f => f.severity === "error").length;
  const warningCount = filteredFindings.filter(f => f.severity === "warning").length;
  const infoCount = filteredFindings.filter(f => f.severity === "info").length;

  // 1. Review Completed Notification
  const completedPref = user.preferences?.notifications?.reviewCompleted ?? "in_app";
  await deliver(completedPref, user, buildCompletedNotification(repo, prNumber, errorCount, warningCount, infoCount), io);

  // 2. Findings Need Attention Notification
  if (errorCount > 0 || warningCount > 0) {
    const attentionPref = user.preferences?.notifications?.findingsNeedAttention ?? "in_app";
    await deliver(attentionPref, user, buildAttentionNotification(repo, prNumber, errorCount, warningCount), io);
  }
};

export const dispatchFailureNotification = async (repo, prNumber, reason, io = null) => {
  if (!repo?.claimedByUserId) return;
  const user = await User.findById(repo.claimedByUserId).select("preferences email");
  if (!user) return;

  const failedPref = user.preferences?.notifications?.reviewFailed ?? "in_app";
  await deliver(failedPref, user, buildFailedNotification(repo, prNumber, reason), io);
};
