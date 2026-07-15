import { Worker } from "bullmq";
import axios from "axios"
import {octokitForInstallation} from "../lib/githubAuth.js"
import Repo from "../models/repo.model.js"
import Review from "../models/review.model.js"
import { postCheckRun } from "../lib/githubChecks.js";
import { redisConnection } from "../lib/redisConnection.js";

new Worker(
    "review-pr",
    async(job)=>{
        const {repoId,installationId,prNumber,headSha} = job.data
        const repo = await Repo.findById(repoId)
        const octokit = octokitForInstallation(installationId);

        const {data:files} = await octokit.pulls.listFiles({
            owner:repo.owner,
            repo:repo.name,
            pull_number:prNumber,
            per_page:100
        })

        const diffFiles = files
            .filter((f)=> !isGeneratedOrVendored(f.filename))
            .map((f) => ({filename:f.filename,patch:f.patch,status:f.status}))

        const review = await Review.create({repoId:repo._id,prNumber:headSha,status:"in_progress"})

        const {data} = await axios.post(`${process.env.AI_SERVICES_URL}/review`,{
            namespace:repo.namespace,
            file:diffFiles,
            model_name: "llama-3.1-8b-instant"
        })

        review.status = "completed"
        review.findings = data.findings;
        await review.save();

        await postCheckRun(octokit,repo,headSha,{ status: "completed", findings: data.findings })
    },
    {connection:redisConnection}
)

function isGeneratedOrVendored(path) {
  return /(^|\/)(dist|build|vendor|node_modules)\//.test(path) || /\.(lock|min\.js)$/.test(path);
}
