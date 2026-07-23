import crypto from "crypto";
import Installation from "../models/installation.model.js";
import Repo from "../models/repo.model.js";
import { reviewQueue, indexQueue } from "../lib/queue.js";
import User from "../models/user.model.js";

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

    res.status(202).json({ recieved: true });

    switch (event) {
      case "installation": {
        const { installation, action } = payload;

        if (action === "deleted") {
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
          await indexQueue.add("full-index", { repoId: repo._id.toString() });
        }
        break;
      }

      case "installation_repositories": {
        const { installation, action } = payload;

        if (action === "removed") {
          for (const r of payload.repositories_removed || []) {
            const [owner, name] = r.full_name.split("/");
            await Repo.findOneAndDelete({ owner, name, installationId: installation.id });
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
          await indexQueue.add("full-index", { repoId: repo._id.toString() });
        }
        break;
      }

      case "pull_request": {
        if (!["opened", "synchronize", "reopened"].includes(payload.action)) break;
        const { repository, pull_request, installation } = payload;
        const repo = await Repo.findOne({
          owner: repository.owner.login,
          name: repository.name,
        });
        if (!repo) break;
        if (!(await isTriggerActive(repo, "pr"))) break;
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
        if (!repo || ref !== `refs/heads/${repo.defaultBranch}`) break;
        if (!(await isTriggerActive(repo, "push"))) break;
        await indexQueue.add("incremental-index", {
          repoId: repo._id.toString(),
          installationId: installation.id,
          commits: payload.commits,
        });
        break;
      }
    }

    const instId = payload.installation?.id;
    if (instId) {
      const inst = await Installation.findOne({ installationId: instId });
      if (inst && inst.userId) {
        req.app.locals.io.to(inst.userId.toString()).emit("dashboardUpdate", { type: "github_webhook", event });
      }
    }
  } catch (error) {
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