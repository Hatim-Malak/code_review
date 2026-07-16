import { Worker } from "bullmq";
import axios from "axios"
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
                findings: [] // reset findings on new run
            },
            { upsert: true, new: true }
        )
        console.log(`Saved initial review state to DB for PR #${prNumber}`);

        const {data} = await axios.post(`${process.env.AI_SERVICES_URL}/review`,{
            namespace: repo.namespace,
            repo_full_name: `${repo.owner}/${repo.name}`,
            files: diffFiles,
            model_name: "llama3-70b-8192"
        })

        review.status = "completed"
        review.findings = data.findings;
        await review.save();
        console.log(`Review completed for PR #${prNumber}`);

        await Activity.create({
            type: data.findings.length === 0 ? "pr_merged_clean" : "review_completed",
            repoId: repo._id,
            prNumber,
            message: data.findings.length === 0 
                ? `PR #${prNumber} passed review with 0 findings` 
                : `Completed review for PR #${prNumber} with ${data.findings.length} finding(s)`
        });

        await postCheckRun(octokit,repo,headSha,{ status: "completed", findings: data.findings })
    },
    {connection:redisConnection}
)

function isGeneratedOrVendored(path) {
  return /(^|\/)(dist|build|vendor|node_modules)\//.test(path) || /\.(lock|min\.js)$/.test(path);
}
