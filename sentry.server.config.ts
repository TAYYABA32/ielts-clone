import * as Sentry from "@sentry/nextjs";

// No-op if SENTRY_DSN is unset — Sentry.init() safely skips reporting rather
// than throwing, so this is deliberately safe to ship without a live DSN
// (see .env.example / DEPLOYMENT.md for what's needed to actually enable it).
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  debug: false,
});
