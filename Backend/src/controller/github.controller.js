import crypto from "crypto";
import Installation from "../models/installation.model.js";
import Repo from "../models/repo.model.js";
import { reviewQueue, indexQueue } from "../lib/queue.js";
import User from "../models/user.model.js";
import logger from "../lib/logger.js";
import Review from "../models/review.model.js";
import Activity from "../models/activity.model.js";
const verifySignature = (req) => {
  const signature = req.headers["x-hub-signature-256"];
  if (!signature) {
    return false;
  }
  const expected =
    "sha256=" +
    crypto
      .createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET)
      .update(req.body)
      .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));//this function is used instead of normal euqal because it is more secure against timing attacks
};

const isTriggerActive = async (repo, trigger) => {
  if (repo.reviewPreferences?.activeTriggers) {
    return repo.reviewPreferences.activeTriggers.includes(trigger);
  }
  if (repo.claimedByUserId) {
    const owner = await User.findById(repo.claimedByUserId).select("preferences");
    if (owner?.preferences?.review?.activeTriggers) {
      return owner.preferences.review.activeTriggers.includes(trigger);
    }
  }
  return true; // no preference set anywhere → default active
};

export const handleWbhook = async (req, res, next) => {
  try {
    if (!verifySignature(req)) {
      return res.status(401).json({ message: "invalid signature" });
    }

    const event = req.headers["x-github-event"];
    const payload = JSON.parse(req.body.toString("utf8"));

    logger.info(`[Webhook] Received event: ${event}, action: ${payload.action}`);

    switch (event) {
      case "installation": {
        const { installation, action } = payload;

        if (action === "deleted") {
          logger.info(`[Webhook] Installation deleted: ${installation.id}`);
          // Cascading delete
          const repos = await Repo.find({ installationId: installation.id });
          for (const r of repos) {
             await Review.deleteMany({ repoId: r._id });
             await Activity.deleteMany({ repoId: r._id });
          }
          await Repo.deleteMany({ installationId: installation.id });
          await Installation.findOneAndDelete({ installationId: installation.id });
          break;
        }

        await Installation.findOneAndUpdate(
          { installationId: installation.id },
          { $set: { installationId: installation.id, accountLogin: installation.account.login, accountType: installation.account.type } },
          { upsert: true }
        );

        for (const r of payload.repositories || []) {
          const [owner, name] = r.full_name.split("/");
          const repo = await Repo.findOneAndUpdate(
            { owner, name },
            { owner, name, installationId: installation.id, namespace: `repo:${installation.id}:${owner}/${name}` },
            { upsert: true, new: true }
          );
          logger.info(`[Webhook] Queueing full index for ${owner}/${name}`);
          await indexQueue.add("full-index", { repoId: repo._id.toString() });
        }
        break;
      }

      case "installation_repositories": {
        const { installation, action } = payload;

        if (action === "removed") {
          for (const r of payload.repositories_removed || []) {
            const [owner, name] = r.full_name.split("/");
            const repo = await Repo.findOne({ owner, name, installationId: installation.id });
            if (repo) {
              await Review.deleteMany({ repoId: repo._id });
              await Activity.deleteMany({ repoId: repo._id });
              await repo.deleteOne();
            }
          }
          break;
        }

        for (const r of payload.repositories_added || []) {
          const [owner, name] = r.full_name.split("/");
          const repo = await Repo.findOneAndUpdate(
            { owner, name },
            { $set: { owner, name, installationId: installation.id, namespace: `repo:${installation.id}:${owner}/${name}` } },
            { upsert: true, new: true }
          );
          logger.info(`[Webhook] Queueing full index for ${owner}/${name}`);
          await indexQueue.add("full-index", { repoId: repo._id.toString() });
        }
        break;
      }

      case "pull_request": {
        if (payload.action === "closed") {
          // A PR was closed or merged. We ignore this safely so it doesn't overwrite our manual 'merged' status or spam the logs.
          break;
        }
        if (!["opened", "synchronize", "reopened"].includes(payload.action)) {
          logger.info(`[Webhook] Ignored PR action: ${payload.action}`);
          break;
        }
        const { repository, pull_request, installation } = payload;
        const repo = await Repo.findOne({
          owner: repository.owner.login,
          name: repository.name,
        });
        if (!repo) {
          logger.warn(`[Webhook] Repo not found in DB: ${repository.owner.login}/${repository.name}`);
          break;
        }
        if (!(await isTriggerActive(repo, "pr"))) {
          logger.info(`[Webhook] PR trigger disabled for ${repository.owner.login}/${repository.name}`);
          break;
        }
        
        logger.info(`[Webhook] Queueing PR review for PR #${pull_request.number} on ${repository.owner.login}/${repository.name}`);
        await reviewQueue.add("review-pr", {
          repoId: repo._id.toString(),
          installationId: installation.id,
          prNumber: pull_request.number,
          headSha: pull_request.head.sha,
        });
        break;
      }

      case "push": {
        const { repository, installation, ref } = payload;
        const repo = await Repo.findOne({
          owner: repository.owner.login,
          name: repository.name,
        });
        if (!repo || ref !== `refs/heads/${repo.defaultBranch}`) {
           logger.info(`[Webhook] Ignored push to non-default branch or unknown repo: ${ref}`);
           break;
        }
        if (!(await isTriggerActive(repo, "push"))) {
           logger.info(`[Webhook] Push trigger disabled for ${repository.owner.login}/${repository.name}`);
           break;
        }
        logger.info(`[Webhook] Queueing incremental index for ${repository.owner.login}/${repository.name}`);
        await indexQueue.add("incremental-index", {
          repoId: repo._id.toString(),
          installationId: installation.id,
          commits: payload.commits,
        });
        break;
      }
    }

    const instId = payload.installation?.id;
    if (instId && ["installation", "installation_repositories"].includes(event)) {
      const inst = await Installation.findOne({ installationId: instId });
      if (inst && inst.userId) {
        req.app.locals.io.to(inst.userId.toString()).emit("dashboardUpdate", { type: "github_webhook", event });
      }
    }
    
    // Send response after successful processing
    res.status(202).json({ recieved: true });
  } catch (error) {
    logger.error(`[Webhook] Error processing webhook: ${error.message}`);
    // If headers already sent, next(error) will crash. Since we moved the response to the end, it's safe.
    next(error);
  }
};

export const linkInstallation = async (req, res, next) => {
  try {
    const { installation_id, state } = req.body;

    if (!installation_id || !state) {
      return res.status(400).json({ message: "installation_id and state are required" });
    }

    if (state !== req.user._id.toString()) {
      return res.status(403).json({ message: "state mismatch, unauthorized linking" });
    }

    let installation = await Installation.findOneAndUpdate(
      { installationId: Number(installation_id) },
      { $set: { userId: req.user._id } },
      { new: true }
    );
    if (!installation) {
      installation = await Installation.create({
        installationId: Number(installation_id),
        accountLogin: "Pending Sync",
        userId: req.user._id,
      });
    }

    const repos = await Repo.find({ installationId: Number(installation_id) });
    const claimed = [];
    const blocked = [];

    for (const repo of repos) {
      if (!repo.claimedByUserId) {
        repo.claimedByUserId = req.user._id;
        repo.claimedAt = new Date();
        await repo.save();
        claimed.push(`${repo.owner}/${repo.name}`);
      } else if (String(repo.claimedByUserId) !== String(req.user._id)) {
        blocked.push(`${repo.owner}/${repo.name}`);
      }
    }

    return res.json({
      message: "Installation successfully linked to your account.",
      claimed,
      blocked,
    });
  } catch (error) {
    next(error);
  }
};