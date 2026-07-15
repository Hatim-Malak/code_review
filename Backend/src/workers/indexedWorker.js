// Backend/src/workers/indexWorker.js
import { Worker } from "bullmq";
import axios from "axios";
import { octokitForInstallation } from "../lib/githubAuth.js";
import { fetchRepoFiles } from "../lib/repoTree.js";
import Repo from "../models/repo.model.js";
import { redisConnection } from "../lib/redisConnection.js";

new Worker(
  "index-repo",
  async (job) => {
    if (job.name === "full-index") return handleFullIndex(job.data);
    if (job.name === "incremental-index") return handleIncrementalIndex(job.data);
  },
  { connection: redisConnection }
);

async function handleFullIndex({ repoId }) {
  const repo = await Repo.findById(repoId);
  const octokit = octokitForInstallation(repo.installationId);

  const files = await fetchRepoFiles(octokit, repo.owner, repo.name, repo.defaultBranch);

  await axios.post(`${process.env.AI_SERVICE_URL}/index`, {
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
}

async function handleIncrementalIndex({ repoId, commits }) {
  const repo = await Repo.findById(repoId);
  const octokit = octokitForInstallation(repo.installationId);

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

  await axios.post(`${process.env.AI_SERVICE_URL}/reindex`, {
    namespace: repo.namespace,
    repo_full_name: `${repo.owner}/${repo.name}`,
    files,
    removed_paths: [...removedPaths],
  });

  repo.lastIndexedSha = commits.at(-1)?.id ?? repo.lastIndexedSha;
  await repo.save();
}

function isSkippable(path) {
  return /(^|\/)(dist|build|vendor|node_modules)\//.test(path) || /\.(lock|min\.js)$/.test(path);
}