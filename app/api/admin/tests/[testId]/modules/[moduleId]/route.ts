import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleApiError";
import { moduleSchema } from "@/lib/validation/testSchemas";
import { syncModuleContent } from "@/lib/admin/syncModuleContent";
import { enforceRateLimit } from "@/lib/rateLimit/enforce";
import { RATE_LIMIT_TIERS } from "@/lib/rateLimit/config";

/** PATCH /api/admin/tests/:testId/modules/:moduleId — save the full current state of a module from the Test Builder. */
export async function PATCH(request: NextRequest, { params }: { params: { testId: string; moduleId: string } }) {
  try {
    await enforceRateLimit(request, RATE_LIMIT_TIERS.admin);
    await requireAdmin();

    const existing = await prisma.module.findUnique({ where: { id: params.moduleId } });
    if (!existing || existing.testId !== params.testId) {
      return NextResponse.json({ error: "Module not found on this test" }, { status: 404 });
    }

    const input = moduleSchema.parse(await request.json());

    await prisma.$transaction((tx) => syncModuleContent(tx, params.moduleId, input));

    const refreshed = await prisma.module.findUnique({
      where: { id: params.moduleId },
      include: {
        passages: { orderBy: { order: "asc" } },
        audioTracks: { orderBy: { order: "asc" } },
        writingTasks: true,
        speakingParts: true,
        questionGroups: { include: { questions: true }, orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json({ module: refreshed });
  } catch (error) {
    return handleApiError(error);
  }
}

/** DELETE /api/admin/tests/:testId/modules/:moduleId — cascades to passages/audioTracks/questionGroups/questions. */
export async function DELETE(request: NextRequest, { params }: { params: { testId: string; moduleId: string } }) {
  try {
    await enforceRateLimit(request, RATE_LIMIT_TIERS.admin);
    await requireAdmin();

    const existing = await prisma.module.findUnique({ where: { id: params.moduleId } });
    if (!existing || existing.testId !== params.testId) {
      return NextResponse.json({ error: "Module not found on this test" }, { status: 404 });
    }

    await prisma.module.delete({ where: { id: params.moduleId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
