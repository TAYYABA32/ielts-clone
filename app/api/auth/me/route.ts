import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleApiError";
import { enforceRateLimit } from "@/lib/rateLimit/enforce";
import { RATE_LIMIT_TIERS } from "@/lib/rateLimit/config";

/**
 * GET /api/auth/me — the current user's app-specific profile (id, name,
 * email, role). Clerk knows who's authenticated; only our own database
 * knows their role, so the client calls this right after a Clerk
 * sign-in/sign-up completes to find out where to redirect. Also doubles as
 * the trigger for just-in-time user provisioning on a brand-new account.
 */
export async function GET(request: NextRequest) {
  try {
    await enforceRateLimit(request, RATE_LIMIT_TIERS.auth);
    const user = await requireUser();
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    return handleApiError(error);
  }
}
