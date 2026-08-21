export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleApiError";
import { parsePagination } from "@/lib/api/pagination";
import { enforceRateLimit } from "@/lib/rateLimit/enforce";
import { RATE_LIMIT_TIERS } from "@/lib/rateLimit/config";

/** GET /api/admin/attempts?page=1&pageSize=20&status=SUBMITTED — CMS view of user results across the platform. */
export async function GET(request: NextRequest) {
  try {
    await enforceRateLimit(request, RATE_LIMIT_TIERS.admin);
    await requireAdmin();

    const { page, pageSize, skip, take } = parsePagination(request.nextUrl.searchParams);
    const status = request.nextUrl.searchParams.get("status");

    const where = status ? { status: status as "IN_PROGRESS" | "SUBMITTED" | "EXPIRED" | "ABANDONED" } : {};

    const [attempts, total] = await Promise.all([
      prisma.testAttempt.findMany({
        where,
        orderBy: { startedAt: "desc" },
        skip,
        take,
        include: {
          user: { select: { id: true, name: true, email: true } },
          test: { select: { id: true, title: true, type: true } },
          moduleAttempts: { include: { module: { select: { type: true } } } },
        },
      }),
      prisma.testAttempt.count({ where }),
    ]);

    return NextResponse.json({ attempts, total, page, pageSize });
  } catch (error) {
    return handleApiError(error);
  }
}
