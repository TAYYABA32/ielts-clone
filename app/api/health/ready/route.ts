import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Critical: without this, Next.js statically prerenders this route at build
// time (the DB query has no request-specific input) and would serve that
// single frozen "ready"/"not_ready" snapshot forever — the exact opposite of
// what a readiness probe is for. This must run fresh on every request.
export const dynamic = "force-dynamic";

/**
 * GET /api/health/ready — readiness probe. Confirms this instance can
 * actually serve traffic, i.e. its one hard dependency (Postgres) is
 * reachable. `SELECT 1` is a deliberate, safe exception to this codebase's
 * "no raw queries" rule (SECURITY_AUDIT.md) — it's a static, hardcoded
 * string with zero user input, so there's no injection surface at all.
 * Rate limiting/email/Redis are NOT checked here: they already fail open
 * elsewhere in the app (a missing Upstash/Resend config doesn't break
 * anything), so an outage in either shouldn't mark this instance not-ready.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ready", checks: { database: "ok" } });
  } catch (error) {
    logger.error({ err: error }, "Readiness check failed: database unreachable");
    return NextResponse.json({ status: "not_ready", checks: { database: "error" } }, { status: 503 });
  }
}
