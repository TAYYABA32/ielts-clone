import type { NextRequest } from "next/server";
import { getRateLimiter, type RateLimitConfig } from "./limiter";
import { getRateLimitIdentifier } from "./identifier";

export class RateLimitExceededError extends Error {
  constructor(
    public retryAfterSeconds: number,
    public limit: number,
    public remaining: number,
    public reset: number
  ) {
    super("Rate limit exceeded");
    this.name = "RateLimitExceededError";
  }
}

/**
 * Checks `tier`'s budget for the caller and throws RateLimitExceededError if
 * exceeded — call at the very top of a route handler, before any other
 * work, inside the same try/catch that already routes to handleApiError().
 *
 * Fails OPEN on any infrastructure problem (Upstash env vars not configured,
 * network error, etc.) rather than blocking every request: a rate limiter is
 * a protective layer on top of a working API, and an unreachable Redis
 * shouldn't turn into a full API outage. A genuine "limit exceeded" result
 * from Upstash is a normal, successful check — only that path throws.
 */
export async function enforceRateLimit(request: NextRequest, tier: RateLimitConfig): Promise<void> {
  let result: Awaited<ReturnType<ReturnType<typeof getRateLimiter>["limit"]>>;

  try {
    const identifier = await getRateLimitIdentifier(request);
    result = await getRateLimiter(tier).limit(identifier);
  } catch (error) {
    // eslint-disable-next-line no-console -- server-side diagnostic, not user-facing; see fail-open rationale above
    console.error(`[rateLimit:${tier.name}] check failed, allowing request through`, error);
    return;
  }

  if (!result.success) {
    const retryAfterSeconds = Math.max(0, Math.ceil((result.reset - Date.now()) / 1000));
    throw new RateLimitExceededError(retryAfterSeconds, result.limit, result.remaining, result.reset);
  }
}
