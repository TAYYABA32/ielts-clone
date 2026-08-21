import { NextResponse } from "next/server";
import { ZodError } from "zod";
import * as Sentry from "@sentry/nextjs";
import { AuthError, OAuthEmailConflictError } from "@/lib/auth/session";
import { UploadValidationError } from "@/lib/storage/saveUploadedFile";
import { RateLimitExceededError } from "@/lib/rateLimit/enforce";
import { LastAdminError } from "@/lib/admin/changeUserRole";
import { logger } from "@/lib/logger";
import { getRequestId } from "@/lib/observability/requestId";

/**
 * Central error->response mapping so every route handler's catch block is
 * one line. Expected client errors (auth/validation/rate-limit/etc.) are
 * logged at `warn` for observability but never reported to Sentry — they're
 * not bugs, and alerting on every 401/422 would drown out the errors that
 * actually need attention. Only the generic `instanceof Error` fallback
 * (a genuinely unexpected failure) is logged at `error` and sent to Sentry.
 */
export function handleApiError(error: unknown): NextResponse {
  const requestId = getRequestId();

  if (error instanceof AuthError) {
    logger.warn({ requestId, status: error.status }, error.message);
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof OAuthEmailConflictError) {
    logger.warn({ requestId, email: error.email }, error.message);
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  if (error instanceof ZodError) {
    logger.warn({ requestId, issues: error.issues }, "Validation failed");
    return NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 422 });
  }
  if (error instanceof UploadValidationError) {
    logger.warn({ requestId, status: error.status }, error.message);
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof RateLimitExceededError) {
    logger.warn({ requestId, limit: error.limit }, "Rate limit exceeded");
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(error.retryAfterSeconds),
          "X-RateLimit-Limit": String(error.limit),
          "X-RateLimit-Remaining": String(error.remaining),
          "X-RateLimit-Reset": String(error.reset),
        },
      }
    );
  }
  if (error instanceof LastAdminError) {
    logger.warn({ requestId }, error.message);
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  if (error instanceof Error) {
    logger.error({ requestId, err: error }, "Unhandled API error");
    Sentry.captureException(error, { tags: { requestId } });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
  logger.error({ requestId, error }, "Unknown (non-Error) API error");
  return NextResponse.json({ error: "Unknown error" }, { status: 500 });
}
