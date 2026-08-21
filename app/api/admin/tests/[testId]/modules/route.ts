import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleApiError";
import { moduleSchema } from "@/lib/validation/testSchemas";
import { syncModuleContent } from "@/lib/admin/syncModuleContent";
import { enforceRateLimit } from "@/lib/rateLimit/enforce";
import { RATE_LIMIT_TIERS } from "@/lib/rateLimit/config";

/**
 * POST /api/admin/tests/:testId/modules — create a new module shell for a test
 * (e.g. the Reading module), then immediately sync in whatever nested content
 * the Test Builder already has staged for it (passages/questions/etc, if any).
 */
export async function POST(request: NextRequest, { params }: { params: { testId: string } }) {
  try {
    await enforceRateLimit(request, RATE_LIMIT_TIERS.admin);
    await requireAdmin();

    const input = moduleSchema.parse(await request.json());

    const createdModule = await prisma.$transaction(async (tx) => {
      const created = await tx.module.create({
        data: {
          testId: params.testId,
          type: input.type,
          order: input.order,
          timeLimitMinutes: input.timeLimitMinutes,
        },
      });
      await syncModuleContent(tx, created.id, input);
      return created;
    });

    return NextResponse.json({ moduleId: createdModule.id }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
