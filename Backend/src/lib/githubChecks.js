


export const postCheckRun =async (octokit,repo,headSha,{status,findings}) =>{
    const annotations = (findings||[]).slice(0,50).map((f)=>({
        path:f.file,
         start_line: f.startLine,
        end_line: f.endLine,
        annotation_level: f.severity === "error" ? "failure" : f.severity === "warning" ? "warning" : "notice",
        message: f.suggestedFix ? `${f.comment}\n\nSuggestion: ${f.suggestedFix}` : f.comment,
    }))

    await octokit.checks.create({
         owner: repo.owner,
        repo: repo.name,
        name: "HatMind Review",
        head_sha: headSha,
        status: status === "completed" ? "completed" : "in_progress",
        conclusion: status === "completed" ? (annotations.some(a => a.annotation_level === "failure") ? "failure" : "success") : undefined,
        output: status === "completed"
        ? { title: `${annotations.length} findings`, summary: "See inline comments.", annotations }
        : { title: "Reviewing…", summary: "HatMind is analyzing this PR." },
    })
}