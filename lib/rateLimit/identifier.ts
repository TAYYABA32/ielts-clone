import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

/**
 * Rate-limit identity: the authenticated Clerk user id when available, so
 * legitimate users behind a shared/corporate IP aren't throttled together —
 * falling back to the client IP for anonymous requests, which is exactly
 * the traffic most worth throttling (unauthenticated brute-force/abuse).
 * Reads the already-verified session from clerkMiddleware; no extra
 * network/DB round trip.
 */
export async function getRateLimitIdentifier(request: NextRequest): Promise<string> {
  const { userId } = await auth();
  if (userId) return `user:${userId}`;

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return `ip:${ip}`;
}
