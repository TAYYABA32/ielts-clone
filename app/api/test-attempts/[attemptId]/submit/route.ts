import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleApiError";
import { gradeModule } from "@/lib/scoring/gradeModule";
import { recomputeOverallBand } from "@/lib/scoring/recomputeOverallBand";
import { finalizeAttemptIfComplete } from "@/lib/scoring/finalizeAttemptIfComplete";
import { toGradableModule } from "@/lib/mappers/toGradableModule";
import { enforceRateLimit } from "@/lib/rateLimit/enforce";
import { RATE_LIMIT_TIERS } from "@/lib/rateLimit/config";

// A module's timeLimitMinutes is at most a few hours in practice; 24h is a
// generous ceiling that rejects obviously-corrupt/malicious values (a
// negative number, a stray float, or an absurdly large one) without risking
// false rejections of legitimate (possibly resumed/paused) attempts.
const MAX_TIME_SECONDS = 86_400;
// Individual answer values are option keys, words, or short phrases — 500
// chars comfortably covers every question type's legitimate input.
const MAX_ANSWER_LENGTH = 500;
// Multi-select answers realistically top out at a handful of option keys.
const MAX_ANSWER_ARRAY_LENGTH = 20;

const answerValueSchema = z.union([
  z.string().max(MAX_ANSWER_LENGTH),
  z.array(z.string().max(MAX_ANSWER_LENGTH)).max(MAX_ANSWER_ARRAY_LENGTH),
]);

const submitRequestSchema = z.object({
  moduleId: z.string().uuid(),
  answers: z.record(answerValueSchema),
  flagged: z.record(z.boolean()),
  timeSpentPerQuestion: z.record(z.number().int().min(0).max(MAX_TIME_SECONDS)),
  totalTimeSpentSeconds: z.number().int().min(0).max(MAX_TIME_SECONDS),
});

/**
 * POST /api/test-attempts/:attemptId/submit
 *
 * Server-authoritative grading: the answer key never leaves the server, so
 * this route is the ONLY place user answers are compared against it. The
 * client only ever sends its own answer JSON; it never receives correctAnswer
 * fields until this response comes back (post-submission review screens can
 * safely reveal them since the attempt is now locked).
 */
export async function POST(request: NextRequest, { params }: { params: { attemptId: string } }) {
  try {
    await enforceRateLimit(request, RATE_LIMIT_TIERS.submit);
    const { attemptId } = params;
    const user = await requireUser();
    const body = submitRequestSchema.parse(await request.json());

    const testAttempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: { test: true },
    });

    if (!testAttempt) {
      return NextResponse.json({ error: "Test attempt not found" }, { status: 404 });
    }
    if (testAttempt.userId !== user.id) {
      throw new AuthError(403, "Not your test attempt");
    }
    if (testAttempt.status === "SUBMITTED") {
      return NextResponse.json({ error: "Attempt already submitted" }, { status: 409 });
    }
    if (testAttempt.status !== "IN_PROGRESS") {
      throw new AuthError(403, "Attempt is no longer in progress");
    }

    const moduleRow = await prisma.module.findUnique({
      where: { id: body.moduleId },
      include: {
        passages: true,
        audioTracks: true,
        questionGroups: { include: { questions: true } },
      },
    });

    if (!moduleRow || moduleRow.testId !== testAttempt.testId || (moduleRow.type !== "READING" && moduleRow.type !== "LISTENING")) {
      return NextResponse.json({ error: "Module not found or not auto-gradable" }, { status: 400 });
    }

    const gradableModule = toGradableModule(moduleRow);
    const result = gradeModule(gradableModule, body.answers, testAttempt.test.type, moduleRow.type);

    const moduleAttempt = await prisma.$transaction(async (tx) => {
      const attempt = await tx.moduleAttempt.upsert({
        where: { testAttemptId_moduleId: { testAttemptId: attemptId, moduleId: body.moduleId } },
        create: {
          testAttemptId: attemptId,
          moduleId: body.moduleId,
          rawScore: result.rawScore,
          maxRawScore: result.maxRawScore,
          bandScore: result.bandScore,
          timeSpentSeconds: body.totalTimeSpentSeconds,
        },
        update: {
          rawScore: result.rawScore,
          maxRawScore: result.maxRawScore,
          bandScore: result.bandScore,
          timeSpentSeconds: body.totalTimeSpentSeconds,
        },
      });

      await tx.questionResponse.deleteMany({ where: { moduleAttemptId: attempt.id } });
      await tx.questionResponse.createMany({
        data: result.questionResults.map((qr) => ({
          moduleAttemptId: attempt.id,
          questionId: qr.questionId,
          userAnswer: qr.userAnswer ?? undefined,
          isCorrect: qr.isCorrect,
          timeSpentSeconds: body.timeSpentPerQuestion[qr.questionId] ?? 0,
          flagged: Boolean(body.flagged[qr.questionId]),
          answeredAt: qr.userAnswer !== undefined ? new Date() : null,
        })),
      });

      // Recompute overall band once all currently-graded modules are in.
      await recomputeOverallBand(tx, attemptId);
      await finalizeAttemptIfComplete(tx, attemptId, testAttempt.testId);

      return attempt;
    });

    return NextResponse.json({
      moduleAttemptId: moduleAttempt.id,
      rawScore: result.rawScore,
      maxRawScore: result.maxRawScore,
      bandScore: result.bandScore,
      questionResults: result.questionResults,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
