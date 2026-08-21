import type { PrismaClient } from "@prisma/client";
import { roundToNearestHalfBand } from "./bandScoreTables";

type TxClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

/**
 * Recomputes and persists TestAttempt.overallBand as the rounded mean of
 * every module attempt that currently has a band score. Called both after
 * auto-grading (Listening/Reading) and after examiner grading
 * (Writing/Speaking) lands, since either can be the last piece to arrive.
 */
export async function recomputeOverallBand(tx: TxClient, testAttemptId: string): Promise<number | null> {
  const moduleAttempts = await tx.moduleAttempt.findMany({ where: { testAttemptId } });
  const bandScores = moduleAttempts.map((m) => m.bandScore).filter((b): b is number => b !== null);

  const overallBand = bandScores.length > 0 ? roundToNearestHalfBand(bandScores.reduce((a, b) => a + b, 0) / bandScores.length) : null;

  await tx.testAttempt.update({
    where: { id: testAttemptId },
    data: { overallBand: overallBand ?? undefined },
  });

  return overallBand;
}
