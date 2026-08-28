import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import logger from "../lib/logger.js";

const rateLimitHandler = (req, res) => {
  logger.warn(`Rate limit exceeded: ${req.ip} — ${req.originalUrl}`);
  res.status(429).json({
    message: "Too many requests. Please slow down and try again shortly.",
  });
};

const customIpKeyGenerator = (req) => {
  return ipKeyGenerator(req);
};

const userOrIpKeyGenerator = (req) => req.user?._id?.toString() || customIpKeyGenerator(req);

// Tier 1: Auth bruteforce (IP-keyed, strictest)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: customIpKeyGenerator,
  handler: rateLimitHandler,
});

// Tier 1.5: OTP Generation (IP-keyed, very strict)
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 2, // Only 2 forgot-password requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: customIpKeyGenerator,
  handler: rateLimitHandler,
});

// Tier 2: AI chat (user-keyed, expensive)
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: userOrIpKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// Tier 3: Queue mutations (user-keyed)
export const mutationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: userOrIpKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// Tier 4: Standard API (user-keyed, generous)
export const standardLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: userOrIpKeyGenerator,
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
  keyGenerator: customIpKeyGenerator,
  handler: rateLimitHandler,
});
