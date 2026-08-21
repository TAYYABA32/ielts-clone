import { NextResponse } from "next/server";

// Without this, Next.js statically prerenders this route at build time
// (nothing here reads request-specific data) and serves that one frozen
// response forever — uptimeSeconds/timestamp would never update, and worse,
// an orchestrator would see a stale "the process has been up for 0 seconds"
// snapshot from build time on every check.
export const dynamic = "force-dynamic";

/**
 * GET /api/health — liveness probe. Confirms the process is up and
 * responding; deliberately has NO dependency on the database or any other
 * external service (that's what /api/health/ready is for) so a slow/down
 * dependency can't make an orchestrator think the whole instance is dead
 * and restart it unnecessarily. Public, unauthenticated, no rate limit —
 * infra probes call this frequently and carry no sensitive data.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}
