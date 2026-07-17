// Backend/src/workers/indexWorker.js
import { Worker } from "bullmq";
import axios from "axios";
import { octokitForInstallation } from "../lib/githubAuth.js";
import { fetchRepoFiles } from "../lib/repoTree.js";
import Repo from "../models/repo.model.js";
import Activity from "../models/activity.model.js";
import { redisConnection } from "../lib/redisConnection.js";
import { connectdb } from "../lib/db.js";
import logger from "../lib/logger.js";

process.on("uncaughtException", () => {
  setTimeout(() => process.exit(1), 500);
});

connectdb();
logger.info("[IndexedWorker] Index worker started, waiting for jobs...");

const worker = new Worker(
  "index-repo",
  async (job) => {
    logger.info(`[IndexedWorker] Picked up job: ${job.name} for repoId: ${job.data.repoId}`);
    if (job.name === "full-index") return handleFullIndex(job.data, job);
    if (job.name === "incremental-index") return handleIncrementalIndex(job.data, job);
  },
  { connection: redisConnection }
);

worker.on("completed", (job) => {
  logger.info(`[IndexedWorker] Job ${job.id} (${job.name}) completed successfully!`);
});

worker.on("failed", (job, err) => {
  logger.info(`[IndexedWorker] Job ${job.id} (${job.name}) failed with error: ${err.message}`);
  logger.info(`[IndexedWorker] Attempts made: ${job.attemptsMade} / 3`);
});

worker.on("error", (err) => {
  logger.error(`[IndexedWorker] Uncaught worker error:`, err);
});

async function handleFullIndex({ repoId }, job) {
  await job.updateProgress(10);
  const repo = await Repo.findById(repoId);
  const octokit = octokitForInstallation(repo.installationId);

  logger.info(`[IndexedWorker] Starting full index for ${repo.owner}/${repo.name}...`);
  const files = await fetchRepoFiles(octokit, repo.owner, repo.name, repo.defaultBranch);
  logger.info(`[IndexedWorker] Fetched ${files.length} files. Sending to AI service for embedding...`);
  
  await job.updateProgress(50);

  await axios.post(`${process.env.AI_SERVICES_URL}/index`, {
    namespace: repo.namespace,
    repo_full_name: `${repo.owner}/${repo.name}`,
    files,
  });

  const { data: branch } = await octokit.repos.getBranch({
    owner: repo.owner,
    repo: repo.name,
    branch: repo.defaultBranch,
  });
  repo.lastIndexedSha = branch.commit.sha;
  await repo.save();

  await Activity.create({
    type: "reindexed",
    repoId: repo._id,
    message: `Completed full knowledge base indexing for repository`
  });
  logger.info(`[IndexedWorker] Successfully fully indexed ${repo.owner}/${repo.name}!`);
  await job.updateProgress(100);
}

async function handleIncrementalIndex({ repoId, commits }, job) {
  await job.updateProgress(10);
  const repo = await Repo.findById(repoId);
  const octokit = octokitForInstallation(repo.installationId);
  logger.info(`[IndexedWorker] Starting incremental index for ${repo.owner}/${repo.name} with ${commits.length} commits...`);
  //...
  // Note: the chunk only spans the exact lines, wait, if I use AllowMultiple I can just replace `logger.info(` with `logger.info(`.

  const changedPaths = new Set();
  const removedPaths = new Set();
  for (const commit of commits) {
    commit.added.concat(commit.modified).forEach((p) => changedPaths.add(p));
    commit.removed.forEach((p) => removedPaths.add(p));
  }
  for (const p of removedPaths) changedPaths.delete(p);

  const files = [];
  for (const path of changedPaths) {
    if (isSkippable(path)) continue;
    const { data } = await octokit.repos.getContent({
      owner: repo.owner,
      repo: repo.name,
      path,
      ref: repo.defaultBranch,
    });
    if (data.encoding === "base64") {
      files.push({ path, content: Buffer.from(data.content, "base64").toString("utf8") });
    }
  }

  logger.info(`[IndexedWorker] Fetched ${files.length} modified/added files. Sending to AI service to reindex...`);
  await job.updateProgress(50);

  await axios.post(`${process.env.AI_SERVICES_URL}/reindex`, {
    namespace: repo.namespace,
    repo_full_name: `${repo.owner}/${repo.name}`,
    files,
    removed_paths: [...removedPaths],
  });

  repo.lastIndexedSha = commits.at(-1)?.id ?? repo.lastIndexedSha;
  await repo.save();

  await Activity.create({
    type: "reindexed",
    repoId: repo._id,
    message: `Updated knowledge base index with ${commits.length} new commit(s)`
  });
  logger.info(`[IndexedWorker] Successfully incrementally indexed ${repo.owner}/${repo.name}!`);
  await job.updateProgress(100);
}

function isSkippable(path) {
  return /(^|\/)(dist|build|vendor|node_modules)\//.test(path) || /\.(lock|min\.js)$/.test(path);
}
