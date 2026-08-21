import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

/**
 * One structured logger for the whole app. JSON output in production
 * (Vercel/most hosts capture stdout as logs directly — no separate shipping
 * step needed); pretty-printed in development for readability. `redact`
 * ensures secrets/PII never reach a log line even if a caller accidentally
 * logs an object that contains them — this is a safety net, not a substitute
 * for callers being deliberate about what they log in the first place.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
  transport: isProd ? undefined : { target: "pino-pretty", options: { colorize: true } },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.token",
      "*.apiKey",
      "*.secret",
      "*.clerkSecretKey",
      "*.serviceRoleKey",
    ],
    censor: "[REDACTED]",
  },
  base: { env: process.env.NODE_ENV },
});
