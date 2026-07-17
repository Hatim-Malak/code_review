import Redis from "ioredis";
import dotenv from "dotenv";
import logger from "./logger.js";
dotenv.config();

export const redisConnection = new Redis(process.env.UPSTASH_REDIS_URL, {
  maxRetriesPerRequest: null, // required by BullMQ
});

redisConnection.on("error", (err) => {
  logger.warn(`Redis connection error: ${err.message}`);
});