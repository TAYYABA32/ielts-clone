import type { PrismaClient } from "@prisma/client";

type TxClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

/**
 * Marks a TestAttempt SUBMITTED once every module configured on its Test has
 * a corresponding ModuleAttempt — i.e. the candidate has been through every
 * module the test defines (Listening/Reading/Writing/Speaking, whichever
 * apply). Writing/Speaking module attempts exist here before an examiner has
 * scored them (see writing-submit/speaking-upload's upsert), so "complete"
 * means "answered", not "fully graded" — examiner grading can still be
 * pending after this flips the attempt to SUBMITTED.
 */
export async function finalizeAttemptIfComplete(tx: TxClient, testAttemptId: string, testId: string): Promise<void> {
  const [configuredModules, moduleAttempts] = await Promise.all([
    tx.module.findMany({ where: { testId }, select: { id: true } }),
    tx.moduleAttempt.findMany({ where: { testAttemptId }, select: { moduleId: true } }),
  ]);

  const attemptedModuleIds = new Set(moduleAttempts.map((ma) => ma.moduleId));
  const isComplete = configuredModules.length > 0 && configuredModules.every((m) => attemptedModuleIds.has(m.id));
  if (!isComplete) return;

  await tx.testAttempt.update({
    where: { id: testAttemptId },
    data: { status: "SUBMITTED", submittedAt: new Date() },
  });
}
