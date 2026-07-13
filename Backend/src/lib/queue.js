import {Queue} from "bullmq"

const connection  = {url:process.env.REDIS_URL};

export const reviewQueue = new Queue("review-pr",{connection});
export const indexQueue = new Queue("index-repo",{connection});

