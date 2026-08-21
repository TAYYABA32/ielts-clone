import * as Sentry from "@sentry/nextjs";

// Client-side init, loaded automatically by the webpack plugin `withSentryConfig`
// wires into next.config.js. Uses NEXT_PUBLIC_SENTRY_DSN since this bundle ships
// to the browser — the server-side DSN (SENTRY_DSN) is a separate env var
// deliberately, even though it's typically the same value, so a mistake in one
// config never silently disables the other.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  debug: false,
});
