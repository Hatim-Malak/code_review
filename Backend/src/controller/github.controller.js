import crypto from "crypto";
import Installation from "../models/installation.model.js";
import Repo from "../models/repo.model.js";
import { reviewQueue, indexQueue } from "../lib/queue.js";

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
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
};

export const handleWbhook = async (req, res) => {
  if (!verifySignature(req)) { 
    return res.status(401).json({ message: "invalid signature" });
  }

  const event = req.headers["x-github-event"];
  const payload = JSON.parse(req.body.toString("utf8"));

  res.status(202).json({ recieved: true });

  switch (event) {
    case "installation":
    case "installation_repositories": {
      const { installation } = payload;
      await Installation.findOneAndUpdate(
        { installationId: installation.id },
        {
          installationId: installation.id,
          accountLogin: installation.account.login,
          accountType: installation.account.type,
        },
        { upsert: true },
      );
      const repos = payload.repositories || payload.repositories_added || [];
      for (const r of repos) {
        const [owner, name] = r.full_name.split("/");
        const repo = await Repo.findOneAndUpdate(
          { owner, name },
          {
            owner,
            name,
            installationId: installation.id,
            namespace: `repo:${installation.id}:${owner}/${name}`,
          },
          { upsert: true, new: true },
        );
        await indexQueue.add("full-index", { repoId: repo._id.toString() });
      }
      break;
    }

    case "pull_request": {
      if (!["opened", "synchronize", "reopened"].includes(payload.action))
        break;
      const { repository, pull_request, installation } = payload;
      const repo = await Repo.findOne({
        owner: repository.owner.login,
        name: repository.name,
      });
      if (!repo) break;
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
      await indexQueue.add("incremental-index", {
        repoId: repo._id.toString(),
        installationId: installation.id,
        commits: payload.commits,
      });
      break;
    }
  }
};

export const linkInstallation = async (req, res) => {
  try {
    const { installation_id, state } = req.body;
    
    if (!installation_id || !state) {
      return res.status(400).json({ message: "installation_id and state are required" });
    }

    // `state` should match the logged-in user's ID
    if (state !== req.user._id.toString()) {
      return res.status(403).json({ message: "state mismatch, unauthorized linking" });
    }

    const installation = await Installation.findOneAndUpdate(
      { installationId: Number(installation_id) },
      { userId: req.user._id },
      { new: true }
    );

    if (!installation) {
      // It's possible the webhook hasn't fired yet, or we got a bad ID.
      // But typically webhook fires first. Let's create a placeholder if it doesn't exist
      await Installation.create({
        installationId: Number(installation_id),
        accountLogin: "Pending Sync",
        userId: req.user._id
      });
    }

    res.json({ message: "Installation successfully linked to your account." });
  } catch (error) {
    console.error("Error linking installation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
