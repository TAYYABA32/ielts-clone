import * as Sentry from "@sentry/nextjs";

/**
 * Next.js instrumentation hook — runs once per server/edge runtime instance
 * at startup. Validates required env vars here (nodejs runtime only —
 * DATABASE_URL etc. aren't meaningful in the edge runtime, which only runs
 * middleware.ts) so a misconfigured deployment fails immediately with a
 * clear message, instead of failing confusingly deep inside the first
 * request that happens to touch Prisma or Clerk.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateRequiredEnv } = await import("./lib/env");
    try {
      validateRequiredEnv();
    } catch (error) {
      // Next.js logs an instrumentation-hook error but does NOT treat it as
      // fatal by default — confirmed by running the actual standalone
      // server (the same one the Dockerfile CMD runs) with a required var
      // missing: it logged the error and then reported "Ready" anyway,
      // continuing to serve requests in a broken state. An explicit
      // process.exit(1) is what actually makes a misconfigured deployment
      // fail to start, which is the entire point of validating here.
      // eslint-disable-next-line no-console -- fires before the app's own
      // logger can be trusted; deliberately plain and dependency-free
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

/** Reports otherwise-unhandled errors from Server Components/Actions that never reach a route handler's try/catch (and so never reach handleApiError). */
export const onRequestError = Sentry.captureRequestError;
