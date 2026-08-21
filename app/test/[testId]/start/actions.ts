"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { CANDIDATE_MODULE_SEQUENCE, getModuleRoute } from "@/lib/testSequence";
import type { ModuleType } from "@/types/test";

/**
 * Creates a fresh TestAttempt (or reuses an existing IN_PROGRESS one) and
 * redirects the candidate into a module. Bound with (testId, targetModuleType)
 * from the landing page's forms — targetModuleType is null for "Start/Resume
 * Full Test" (auto-picks the next not-yet-attempted module) and a specific
 * type for "practice this module only" links.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- FormData param is required by the <form action={fn.bind(null, ...)}> contract even though this action ignores form fields
export async function startOrResumeAttempt(testId: string, targetModuleType: ModuleType | null, _formData: FormData) {
  const user = await requireUser();

  const test = await prisma.test.findUnique({ where: { id: testId } });
  if (!test) throw new Error("Test not found");

  let attempt = await prisma.testAttempt.findFirst({
    where: { userId: user.id, testId, status: "IN_PROGRESS" },
    orderBy: { startedAt: "desc" },
  });
  if (!attempt) {
    attempt = await prisma.testAttempt.create({ data: { userId: user.id, testId } });
  }

  let moduleType = targetModuleType;
  if (!moduleType) {
    const attemptedTypes = new Set(
      (
        await prisma.moduleAttempt.findMany({
          where: { testAttemptId: attempt.id },
          include: { module: { select: { type: true } } },
        })
      ).map((ma) => ma.module.type)
    );

    for (const candidate of CANDIDATE_MODULE_SEQUENCE) {
      if (attemptedTypes.has(candidate)) continue;
      const exists = await prisma.module.findFirst({ where: { testId, type: candidate } });
      if (exists) {
        moduleType = candidate;
        break;
      }
    }
  }
  if (!moduleType) throw new Error("This test has no remaining modules to attempt");

  const moduleRow = await prisma.module.findFirst({ where: { testId, type: moduleType } });
  if (!moduleRow) throw new Error(`This test has no ${moduleType} module configured`);

  redirect(getModuleRoute({ attemptId: attempt.id, moduleType, moduleId: moduleRow.id }));
}
