import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleApiError";
import { parsePagination } from "@/lib/api/pagination";
import { createTestRecord } from "@/lib/admin/createTest";
import { enforceRateLimit } from "@/lib/rateLimit/enforce";
import { RATE_LIMIT_TIERS } from "@/lib/rateLimit/config";

/** GET /api/admin/tests?page=1&pageSize=20 — paginated test list for the CMS index. */
export async function GET(request: NextRequest) {
  try {
    await enforceRateLimit(request, RATE_LIMIT_TIERS.admin);
    await requireAdmin();

    const { page, pageSize, skip, take } = parsePagination(request.nextUrl.searchParams);

    const [tests, total] = await Promise.all([
      prisma.test.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: { _count: { select: { modules: true, testAttempts: true } } },
      }),
      prisma.test.count(),
    ]);

    return NextResponse.json({ tests, total, page, pageSize });
  } catch (error) {
    return handleApiError(error);
  }
}

/** POST /api/admin/tests — create a new (empty) test shell; modules are added afterward via the Test Builder. */
export async function POST(request: NextRequest) {
  try {
    await enforceRateLimit(request, RATE_LIMIT_TIERS.admin);
    await requireAdmin();

    const test = await createTestRecord(await request.json());

    return NextResponse.json({ test }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
