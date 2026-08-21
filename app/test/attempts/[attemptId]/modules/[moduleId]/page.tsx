import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { toGradableModule } from "@/lib/mappers/toGradableModule";
import { toClientModule } from "@/lib/mappers/toClientModule";
import { resolveNextModuleHref } from "@/lib/testSequence";
import { TestEngineClientWrapper } from "@/components/test-engine/TestEngineClientWrapper";
import type { UserAnswerMap } from "@/types/test";

export default async function TestModulePage({ params }: { params: { attemptId: string; moduleId: string } }) {
  const user = await requireUser();

  const attempt = await prisma.testAttempt.findUnique({
    where: { id: params.attemptId },
    include: { test: true },
  });
  if (!attempt || attempt.userId !== user.id) notFound();
  if (attempt.status !== "IN_PROGRESS") redirect(`/dashboard/attempts/${attempt.id}`);

  const moduleRow = await prisma.module.findUnique({
    where: { id: params.moduleId },
    include: {
      passages: true,
      audioTracks: true,
      questionGroups: { include: { questions: true } },
    },
  });
  if (!moduleRow || moduleRow.testId !== attempt.testId) notFound();
  if (moduleRow.type !== "READING" && moduleRow.type !== "LISTENING") {
    // Writing/Speaking use a different, non-auto-graded engine (out of scope here).
    notFound();
  }

  // toGradableModule()'s output (with answer keys) never leaves this server
  // component — only the stripped, client-safe shape is passed down.
  const clientModule = toClientModule(toGradableModule(moduleRow));

  const savedProgress = await prisma.savedProgress.findUnique({ where: { testAttemptId: attempt.id } });
  const remainingSecondsAtLoad = savedProgress?.remainingSeconds ?? moduleRow.timeLimitMinutes * 60;
  const nextModule = await resolveNextModuleHref(attempt.testId, attempt.id, moduleRow.type);

  return (
    <TestEngineClientWrapper
      moduleType={moduleRow.type}
      module={clientModule}
      testType={attempt.test.type}
      attemptId={attempt.id}
      moduleId={moduleRow.id}
      initialAnswers={(savedProgress?.responsesJson as UserAnswerMap) ?? undefined}
      initialFlagged={(savedProgress?.flaggedJson as Record<string, boolean>) ?? undefined}
      remainingSecondsAtLoad={remainingSecondsAtLoad}
      nextModule={nextModule}
    />
  );
}
