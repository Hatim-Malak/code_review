// One-off script to re-queue full-index jobs for all repos
import dotenv from "dotenv";
dotenv.config();

import { connectdb } from "../lib/db.js";
import { indexQueue } from "../lib/queue.js";
import Repo from "../models/repo.model.js";

await connectdb();

const repos = await Repo.find({});
console.log(`Found ${repos.length} repos to re-index:\n`);

for (const repo of repos) {
  console.log(`  Queuing full-index for ${repo.owner}/${repo.name} (ID: ${repo._id})`);
  await indexQueue.add("full-index", { repoId: repo._id.toString() });
}

console.log(`\nDone! ${repos.length} full-index jobs added to the queue.`);
console.log("Make sure your indexedWorker.js is running to process them.");
process.exit(0);
