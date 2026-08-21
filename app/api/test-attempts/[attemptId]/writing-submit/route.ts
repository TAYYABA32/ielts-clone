import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleApiError";
import { recomputeOverallBand } from "@/lib/scoring/recomputeOverallBand";
import { finalizeAttemptIfComplete } from "@/lib/scoring/finalizeAttemptIfComplete";
import { countWords } from "@/lib/utils/wordCount";
import { enforceRateLimit } from "@/lib/rateLimit/enforce";
import { RATE_LIMIT_TIERS } from "@/lib/rateLimit/config";

// A generous ceiling, not a realistic-essay-length limit — IELTS Writing
// tasks expect a few hundred words; 20,000 chars covers any legitimate essay
// with room to spare while rejecting unbounded submissions that previously
// relied entirely on the hosting platform's default body-size limit rather
// than an intentional application cap (SECURITY_AUDIT.md M4).
const MAX_ESSAY_LENGTH = 20_000;

const writingSubmitSchema = z.object({
  moduleId: z.string().uuid(),
  responses: z.record(z.string().max(MAX_ESSAY_LENGTH)),
});

/**
 * POST /api/test-attempts/:attemptId/writing-submit
 * Stores the candidate's essays and marks the Writing module attempt as
 * awaiting examiner review (bandScore stays null until an admin scores it
 * via PATCH /api/admin/attempts/:attemptId/module-attempts/:moduleAttemptId).
 */
export async function POST(request: NextRequest, { params }: { params: { attemptId: string } }) {
  try {
    await enforceRateLimit(request, RATE_LIMIT_TIERS.submit);
    const user = await requireUser();
    const { moduleId, responses } = writingSubmitSchema.parse(await request.json());

    const attempt = await prisma.testAttempt.findUnique({ where: { id: params.attemptId } });
    if (!attempt || attempt.userId !== user.id) {
      throw new AuthError(403, "Not your test attempt");
    }
    if (attempt.status !== "IN_PROGRESS") {
      throw new AuthError(403, "Attempt is no longer in progress");
    }

    const moduleRow = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { writingTasks: true },
    });
    if (!moduleRow || moduleRow.testId !== attempt.testId || moduleRow.type !== "WRITING") {
      return NextResponse.json({ error: "Writing module not found on this attempt" }, { status: 404 });
    }

    const taskWordCounts: Record<string, number> = {};

    const moduleAttempt = await prisma.$transaction(async (tx) => {
      const attemptRecord = await tx.moduleAttempt.upsert({
        where: { testAttemptId_moduleId: { testAttemptId: params.attemptId, moduleId } },
        create: { testAttemptId: params.attemptId, moduleId },
        update: {}, // never reset an existing examiner-assigned bandScore on resubmit
      });

      for (const task of moduleRow.writingTasks) {
        const responseText = responses[task.id] ?? "";
        const wordCount = countWords(responseText);
        taskWordCounts[task.id] = wordCount;

        await tx.writingResponse.upsert({
          where: { moduleAttemptId_writingTaskId: { moduleAttemptId: attemptRecord.id, writingTaskId: task.id } },
          create: {
            moduleAttemptId: attemptRecord.id,
            writingTaskId: task.id,
            responseText,
            wordCount,
            submittedAt: new Date(),
          },
          update: { responseText, wordCount, submittedAt: new Date() },
        });
      }

      await recomputeOverallBand(tx, params.attemptId);
      await finalizeAttemptIfComplete(tx, params.attemptId, attempt.testId);

      return attemptRecord;
    });

    return NextResponse.json({ moduleAttemptId: moduleAttempt.id, taskWordCounts });
  } catch (error) {
    return handleApiError(error);
  }
}
