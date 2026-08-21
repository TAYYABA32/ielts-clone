import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateLimitConfig {
  /** Unique name — becomes the Redis key prefix, keeping every tier's counters isolated from every other's. */
  name: string;
  /** Max requests allowed per identifier within `window`. */
  limit: number;
  /** e.g. "60 s", "1 m" — see @upstash/ratelimit's Duration type. */
  window: `${number} ${"ms" | "s" | "m" | "h" | "d"}`;
}

let cachedRedis: Redis | null = null;

/**
 * Uses the REST-based Upstash client (not raw Redis TCP), which is what
 * makes this work on Vercel serverless/Edge — no persistent connection to
 * pool or leak across invocations, just HTTPS requests. Lazily constructed
 * so a missing env var only surfaces when a route actually rate-limits a
 * request, not at module load / build time.
 */
function getRedis(): Redis {
  if (cachedRedis) return cachedRedis;
  cachedRedis = Redis.fromEnv();
  return cachedRedis;
}

const limiters = new Map<string, Ratelimit>();

/**
 * Returns a cached Ratelimit instance per tier `name`, constructing it once
 * per server process — Ratelimit instances are cheap to reuse and creating
 * a fresh one per request would be wasteful.
 */
export function getRateLimiter(config: RateLimitConfig): Ratelimit {
  const existing = limiters.get(config.name);
  if (existing) return existing;

  const limiter = new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(config.limit, config.window),
    prefix: `ratelimit:${config.name}`,
    analytics: true,
  });
  limiters.set(config.name, limiter);
  return limiter;
}
