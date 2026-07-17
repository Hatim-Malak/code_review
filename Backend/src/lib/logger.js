import winston from "winston";
import "winston-daily-rotate-file";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define level based on environment
const env = process.env.NODE_ENV || "development";
const isProduction = env === "production";

const level = () => {
  return isProduction ? "warn" : "debug";
};

// Define colors for each level
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

// Custom format for console (development)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Custom format for files (production)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.json()
);

const transports = [];
const exceptionHandlers = [];
const rejectionHandlers = [];

if (isProduction) {
  // Docker-idiomatic logging: everything goes to stdout/stderr in JSON format
  const prodTransport = new winston.transports.Console({ format: fileFormat });
  transports.push(prodTransport);
  exceptionHandlers.push(prodTransport);
  rejectionHandlers.push(prodTransport);
} else {
  // Development: Console (human-readable) + Rotated Files
  transports.push(new winston.transports.Console({ format: consoleFormat }));
  
  transports.push(new winston.transports.DailyRotateFile({
    filename: path.join(__dirname, "../../logs/error-%DATE%.log"),
    level: "error",
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
    format: fileFormat,
  }));

  transports.push(new winston.transports.DailyRotateFile({
    filename: path.join(__dirname, "../../logs/application-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
    format: fileFormat,
  }));

  exceptionHandlers.push(new winston.transports.DailyRotateFile({
    filename: path.join(__dirname, "../../logs/exceptions-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
    format: fileFormat,
  }));

  rejectionHandlers.push(new winston.transports.DailyRotateFile({
    filename: path.join(__dirname, "../../logs/rejections-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
    format: fileFormat,
  }));
}

const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  exceptionHandlers,
  rejectionHandlers,
  exitOnError: false, // Prevents Winston from dictating process exits natively
});

export default logger;
