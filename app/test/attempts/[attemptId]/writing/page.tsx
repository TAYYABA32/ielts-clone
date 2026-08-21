import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { WritingEngineClientWrapper } from "@/components/test-engine/WritingEngineClientWrapper";
import { resolveNextModuleHref } from "@/lib/testSequence";
import type { UserAnswerMap } from "@/types/test";

export default async function WritingModulePage({ params }: { params: { attemptId: string } }) {
  const user = await requireUser();

  const attempt = await prisma.testAttempt.findUnique({
    where: { id: params.attemptId },
    include: { test: true },
  });
  if (!attempt || attempt.userId !== user.id) notFound();
  if (attempt.status !== "IN_PROGRESS") redirect(`/dashboard/attempts/${attempt.id}`);

  const moduleRow = await prisma.module.findFirst({
    where: { testId: attempt.testId, type: "WRITING" },
    include: { writingTasks: { orderBy: { taskNumber: "asc" } } },
  });
  if (!moduleRow || moduleRow.writingTasks.length === 0) notFound();

  const savedProgress = await prisma.savedProgress.findUnique({ where: { testAttemptId: attempt.id } });
  const remainingSecondsAtLoad = savedProgress?.remainingSeconds ?? moduleRow.timeLimitMinutes * 60;

  // Saved progress is a single JSON blob shared across whichever module the
  // candidate was last in; task ids and question ids are both UUIDs from
  // disjoint tables, so there's no key collision reusing it here.
  const initialResponses = (savedProgress?.responsesJson as UserAnswerMap | undefined) ?? {};
  const writingInitialResponses: Record<string, string> = {};
  for (const task of moduleRow.writingTasks) {
    const value = initialResponses[task.id];
    if (typeof value === "string") writingInitialResponses[task.id] = value;
  }

  const nextModule = await resolveNextModuleHref(attempt.testId, attempt.id, "WRITING");

  return (
    <WritingEngineClientWrapper
      attemptId={attempt.id}
      moduleId={moduleRow.id}
      testType={attempt.test.type}
      tasks={moduleRow.writingTasks.map((t) => ({
        id: t.id,
        taskNumber: t.taskNumber as 1 | 2,
        prompt: t.prompt,
        imageUrl: t.imageUrl ?? undefined,
        minWords: t.minWords,
        timeLimitMinutes: t.timeLimitMinutes,
      }))}
      initialResponses={writingInitialResponses}
      remainingSecondsAtLoad={remainingSecondsAtLoad}
      nextModule={nextModule}
    />
  );
}
