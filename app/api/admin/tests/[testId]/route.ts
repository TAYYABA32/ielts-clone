import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireRole } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleApiError";
import { updateTestSchema } from "@/lib/validation/testSchemas";
import { enforceRateLimit } from "@/lib/rateLimit/enforce";
import { RATE_LIMIT_TIERS } from "@/lib/rateLimit/config";

const FULL_TEST_INCLUDE = {
  modules: {
    orderBy: { order: "asc" as const },
    include: {
      passages: { orderBy: { order: "asc" as const } },
      audioTracks: { orderBy: { order: "asc" as const } },
      writingTasks: { orderBy: { taskNumber: "asc" as const } },
      speakingParts: { orderBy: { partNumber: "asc" as const } },
      questionGroups: {
        orderBy: { order: "asc" as const },
        include: { questions: { orderBy: { order: "asc" as const } } },
      },
    },
  },
};

/** GET /api/admin/tests/:testId — full nested test tree, used to hydrate the Test Builder form. */
export async function GET(request: NextRequest, { params }: { params: { testId: string } }) {
  try {
    await enforceRateLimit(request, RATE_LIMIT_TIERS.admin);
    await requireAdmin();

    const test = await prisma.test.findUnique({
      where: { id: params.testId },
      include: FULL_TEST_INCLUDE,
    });

    if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });
    return NextResponse.json({ test });
  } catch (error) {
    return handleApiError(error);
  }
}

/** PATCH /api/admin/tests/:testId — update top-level test metadata (title/type/isPublished). */
export async function PATCH(request: NextRequest, { params }: { params: { testId: string } }) {
  try {
    await enforceRateLimit(request, RATE_LIMIT_TIERS.admin);
    await requireAdmin();

    const body = updateTestSchema.parse(await request.json());
    const test = await prisma.test.update({ where: { id: params.testId }, data: body });

    return NextResponse.json({ test });
  } catch (error) {
    return handleApiError(error);
  }
}

/** DELETE /api/admin/tests/:testId — full ADMIN only; content editors can edit but not permanently delete a published test. */
export async function DELETE(request: NextRequest, { params }: { params: { testId: string } }) {
  try {
    await enforceRateLimit(request, RATE_LIMIT_TIERS.admin);
    await requireRole("ADMIN");

    await prisma.test.delete({ where: { id: params.testId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
