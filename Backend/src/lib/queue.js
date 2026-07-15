import { Queue } from "bullmq";
import { redisConnection } from "./redisConnection.js";

export const reviewQueue = new Queue("review-pr", { connection: redisConnection });
export const indexQueue = new Queue("index-repo", { connection: redisConnection });