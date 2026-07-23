import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import logger from "../lib/logger.js";

const rateLimitHandler = (req, res) => {
  logger.warn(`Rate limit exceeded: ${req.ip} — ${req.originalUrl}`);
  res.status(429).json({
    message: "Too many requests. Please slow down and try again shortly.",
  });
};

// Tier 1: Auth bruteforce (IP-keyed, strictest)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// Tier 2: AI chat (user-keyed, expensive)
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?._id?.toString() || ipKeyGenerator(req),
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// Tier 3: Queue mutations (user-keyed)
export const mutationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?._id?.toString() || ipKeyGenerator(req),
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// Tier 4: Standard API (user-keyed, generous)
export const standardLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => req.user?._id?.toString() || ipKeyGenerator(req),
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// Tier 5: Webhooks (IP-keyed)
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
