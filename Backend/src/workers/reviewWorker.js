import { Worker } from "bullmq";
import axios from "axios";
import { sweepQueue } from "../lib/queue.js";
import {octokitForInstallation} from "../lib/githubAuth.js"
import Repo from "../models/repo.model.js"
import Review from "../models/review.model.js"
import Activity from "../models/activity.model.js"
import { postCheckRun } from "../lib/githubChecks.js";
import { redisConnection } from "../lib/redisConnection.js";
import { connectdb } from "../lib/db.js";

connectdb();
console.log("Review worker started, waiting for jobs...");

new Worker(
    "review-pr",
    async(job)=>{
        console.log(`Processing review job for PR #${job.data.prNumber}`);
        const {repoId,installationId,prNumber,headSha} = job.data
        const repo = await Repo.findById(repoId)
        
        await Activity.create({
            type: "review_started",
            repoId: repo._id,
            prNumber,
            message: `Started AI review for PR #${prNumber}`
        });

        const octokit = octokitForInstallation(installationId);

        const { data: prData } = await octokit.pulls.get({
            owner: repo.owner,
            repo: repo.name,
            pull_number: prNumber,
        });

        const { data: filesResponse } = await octokit.pulls.listFiles({
            owner: repo.owner,
            repo: repo.name,
            pull_number: prNumber,
            per_page: 100
        });
        
        const diffFiles = filesResponse
            .filter((f)=> !isGeneratedOrVendored(f.filename))
            .map((f) => ({filename:f.filename,patch:f.patch,status:f.status}));

        const review = await Review.findOneAndUpdate(
            { repoId: repo._id, prNumber },
            {
                prTitle: prData.title,
                prAuthor: {
                    name: prData.user.login,
                    avatarUrl: prData.user.avatar_url,
                },
                headSha,
                status: "in_progress",
            },
            { upsert: true, new: true }
        )
        console.log(`Saved initial review state to DB for PR #${prNumber}`);

        try {
            const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
            await axios.post(`${process.env.AI_SERVICES_URL}/review`, {
                namespace: repo.namespace,
                repo_full_name: `${repo.owner}/${repo.name}`,
                files: diffFiles,
                model_name: "llama-3.3-70b-versatile",
                callback_url: `${backendUrl}/api/repos/internal/ai-webhook?repoId=${repo._id}&prNumber=${prNumber}&headSha=${headSha}`,
                callback_token: process.env.AI_CALLBACK_SECRET || "default_secret_for_dev"
            });
            console.log(`[ReviewWorker] Successfully dispatched AI background review for PR #${prNumber}`);
        } catch (error) {
            console.error(`[ReviewWorker] AI Service failed to accept request for PR #${prNumber}:`, error.message);
            review.status = "failed";
            await review.save();
            
            await Activity.create({
                type: "review_failed",
                repoId: repo._id,
                prNumber,
                message: `Review failed to start for PR #${prNumber} due to AI service error`
            });
            
            throw error; // Let BullMQ retry
        }
    },
    {connection:redisConnection}
)

function isGeneratedOrVendored(path) {
  return /(^|\/)(dist|build|vendor|node_modules)\//.test(path) || /\.(lock|min\.js)$/.test(path);
}

console.log("Sweep worker started, waiting for jobs...");

new Worker(
    "sweep-stuck-reviews",
    async (job) => {
        console.log("Running reconciliation sweep for stuck reviews...");
        
        // Find reviews stuck in 'in_progress' for more than 10 minutes
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        
        const stuckReviews = await Review.find({
            status: "in_progress",
            updatedAt: { $lt: tenMinutesAgo }
        });

        if (stuckReviews.length === 0) {
            console.log("No stuck reviews found.");
            return;
        }

        console.log(`Found ${stuckReviews.length} stuck reviews. Failing them.`);

        for (const review of stuckReviews) {
            review.status = "failed";
            await review.save();

            await Activity.create({
                type: "review_failed",
                repoId: review.repoId,
                prNumber: review.prNumber,
                message: `Review for PR #${review.prNumber} failed due to timeout (no AI webhook received)`
            });
        }
    },
    { connection: redisConnection }
);

// Add a repeating job to run the sweep every 5 minutes
sweepQueue.add(
    "sweep-job",
    {},
    {
        repeat: {
            every: 5 * 60 * 1000, // 5 minutes
        }
    }
).catch(err => console.error("Failed to add repeating sweep job:", err));
