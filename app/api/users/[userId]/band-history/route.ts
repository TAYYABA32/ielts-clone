import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/handleApiError";
import { enforceRateLimit } from "@/lib/rateLimit/enforce";
import { RATE_LIMIT_TIERS } from "@/lib/rateLimit/config";

export interface BandHistoryPoint {
  testAttemptId: string;
  testTitle: string;
  submittedAt: string;
  overallBand: number | null;
  moduleBands: Partial<Record<"LISTENING" | "READING" | "WRITING" | "SPEAKING", number>>;
}

/**
 * GET /api/users/:userId/band-history
 * Chronological list of submitted attempts with their overall + per-module
 * band scores, feeding the progression chart on the analytics dashboard.
 * A user may only fetch their own history; admins/content editors may fetch
 * any user's (e.g. for a 1:1 progress review).
 */
export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    await enforceRateLimit(request, RATE_LIMIT_TIERS.admin);
    const requester = await requireUser();
    if (requester.id !== params.userId && requester.role === "STUDENT") {
      throw new AuthError(403, "Cannot view another student's band history");
    }

    const attempts = await prisma.testAttempt.findMany({
      where: { userId: params.userId, status: "SUBMITTED" },
      orderBy: { submittedAt: "asc" },
      include: {
        test: { select: { title: true } },
        moduleAttempts: { include: { module: { select: { type: true } } } },
      },
    });

    const history: BandHistoryPoint[] = attempts.map((attempt) => {
      const moduleBands: BandHistoryPoint["moduleBands"] = {};
      for (const ma of attempt.moduleAttempts) {
        if (ma.bandScore !== null) moduleBands[ma.module.type] = ma.bandScore;
      }
      return {
        testAttemptId: attempt.id,
        testTitle: attempt.test.title,
        submittedAt: (attempt.submittedAt ?? attempt.startedAt).toISOString(),
        overallBand: attempt.overallBand,
        moduleBands,
      };
    });

    return NextResponse.json({ history });
  } catch (error) {
    return handleApiError(error);
  }
}
