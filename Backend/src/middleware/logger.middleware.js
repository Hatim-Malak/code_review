import morgan from "morgan";
import logger from "../lib/logger.js";

// Setup morgan to pipe HTTP logs directly to winston's 'http' level
const stream = {
  write: (message) => logger.http(message.trim()),
};

export const requestLogger = morgan(
  ":method :url :status :res[content-length] - :response-time ms",
  { stream }
);

// Global error handler middleware
export const errorLogger = (err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  if (err.stack) {
    logger.error(err.stack);
  }
  
  // Forward to default express error handler if needed, or send custom response
  res.status(err.status || 500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined
  });
};
