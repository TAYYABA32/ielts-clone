import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleApiError";
import { enforceRateLimit } from "@/lib/rateLimit/enforce";
import { RATE_LIMIT_TIERS } from "@/lib/rateLimit/config";

const saveProgressSchema = z.object({
  responsesJson: z.record(z.union([z.string(), z.array(z.string())])),
  flaggedJson: z.record(z.boolean()),
  remainingSeconds: z.number().int().min(0),
});

async function assertOwnsInProgressAttempt(attemptId: string, userId: string) {
  const attempt = await prisma.testAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== userId) {
    throw new AuthError(403, "Not your test attempt");
  }
  if (attempt.status !== "IN_PROGRESS") {
    throw new AuthError(403, "Attempt is no longer in progress");
  }
  return attempt;
}

/** GET /api/test-attempts/:attemptId/progress — fetch autosaved state to resume a paused attempt. */
export async function GET(request: NextRequest, { params }: { params: { attemptId: string } }) {
  try {
    await enforceRateLimit(request, RATE_LIMIT_TIERS.autosave);
    const user = await requireUser();
    await assertOwnsInProgressAttempt(params.attemptId, user.id);

    const saved = await prisma.savedProgress.findUnique({ where: { testAttemptId: params.attemptId } });
    return NextResponse.json({ savedProgress: saved });
  } catch (error) {
    return handleApiError(error);
  }
}

/** PUT /api/test-attempts/:attemptId/progress — autosave current answers/flags/remaining time (called periodically + on unload). */
export async function PUT(request: NextRequest, { params }: { params: { attemptId: string } }) {
  try {
    await enforceRateLimit(request, RATE_LIMIT_TIERS.autosave);
    const user = await requireUser();
    await assertOwnsInProgressAttempt(params.attemptId, user.id);

    const body = saveProgressSchema.parse(await request.json());

    const saved = await prisma.savedProgress.upsert({
      where: { testAttemptId: params.attemptId },
      create: { userId: user.id, testAttemptId: params.attemptId, ...body },
      update: body,
    });

    return NextResponse.json({ savedProgress: saved });
  } catch (error) {
    return handleApiError(error);
  }
}
