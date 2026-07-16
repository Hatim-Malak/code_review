import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

export const redisConnection = new Redis(process.env.UPSTASH_REDIS_URL, {
  maxRetriesPerRequest: null, // required by BullMQ
});