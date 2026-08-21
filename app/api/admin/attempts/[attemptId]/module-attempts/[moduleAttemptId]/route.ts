import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleApiError";
import { recomputeOverallBand } from "@/lib/scoring/recomputeOverallBand";
import { enforceRateLimit } from "@/lib/rateLimit/enforce";
import { RATE_LIMIT_TIERS } from "@/lib/rateLimit/config";
import { logAction } from "@/lib/audit/logAction";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { sendEmail } from "@/lib/email/sendEmail";
import { buildGradedNotificationEmail } from "@/lib/email/templates/gradedNotification";

const examinerScoreSchema = z.object({
  bandScore: z.number().min(0).max(9).multipleOf(0.5),
  examinerNotes: z.string().optional(),
});

/**
 * PATCH /api/admin/attempts/:attemptId/module-attempts/:moduleAttemptId
 * Records an examiner's manual band score for a Writing or Speaking module
 * attempt (these two modules are never auto-graded) and rolls it into the
 * attempt's overall band.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { attemptId: string; moduleAttemptId: string } }
) {
  try {
    await enforceRateLimit(request, RATE_LIMIT_TIERS.admin);
    const examiner = await requireAdmin();

    const moduleAttempt = await prisma.moduleAttempt.findUnique({
      where: { id: params.moduleAttemptId },
      include: {
        module: { select: { type: true, testId: true } },
        testAttempt: {
          select: {
            user: { select: { email: true, name: true } },
            test: { select: { title: true } },
          },
        },
      },
    });

    if (!moduleAttempt || moduleAttempt.testAttemptId !== params.attemptId) {
      return NextResponse.json({ error: "Module attempt not found on this test attempt" }, { status: 404 });
    }
    if (moduleAttempt.module.type !== "WRITING" && moduleAttempt.module.type !== "SPEAKING") {
      return NextResponse.json({ error: "Only Writing/Speaking modules accept examiner scores; Listening/Reading are auto-graded" }, { status: 400 });
    }

    const { bandScore, examinerNotes } = examinerScoreSchema.parse(await request.json());

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.moduleAttempt.update({
        where: { id: params.moduleAttemptId },
        data: { bandScore, examinerNotes },
      });
      await recomputeOverallBand(tx, params.attemptId);
      await logAction(tx, {
        actor: examiner,
        action: AUDIT_ACTIONS.MODULE_ATTEMPT_GRADED,
        targetType: "ModuleAttempt",
        targetId: params.moduleAttemptId,
        metadata: {
          testAttemptId: params.attemptId,
          moduleType: moduleAttempt.module.type,
          previousBandScore: moduleAttempt.bandScore,
          bandScore,
          examinerNotes: examinerNotes ?? null,
        },
      });
      return result;
    });

    // Sent after the transaction commits, not from inside it — an external
    // API call has no place holding a DB transaction open. Best-effort:
    // sendEmail() never throws, so a delivery failure can't undo the grade
    // that was just recorded. No persisted per-user opt-out yet — see
    // DATABASE_MIGRATION_PLAN.md's proposed `User.emailOnGraded` field.
    await sendEmail(
      buildGradedNotificationEmail({
        to: moduleAttempt.testAttempt.user.email,
        candidateName: moduleAttempt.testAttempt.user.name,
        testTitle: moduleAttempt.testAttempt.test.title,
        moduleType: moduleAttempt.module.type as "WRITING" | "SPEAKING",
        bandScore,
        resultsUrl: `${request.nextUrl.origin}/dashboard/attempts/${params.attemptId}`,
      })
    );

    return NextResponse.json({ moduleAttempt: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
