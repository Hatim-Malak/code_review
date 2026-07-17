import { Queue } from "bullmq";
import { redisConnection } from "./redisConnection.js";

export const reviewQueue = new Queue("review-pr", { 
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 }
  }
});
export const indexQueue = new Queue("index-repo", { 
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 }
  }
});
export const sweepQueue = new Queue("sweep-stuck-reviews", { 
  connection: redisConnection,
});