import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { SpeakingEngineClientWrapper } from "@/components/test-engine/SpeakingEngineClientWrapper";
import { resolveNextModuleHref } from "@/lib/testSequence";

export default async function SpeakingModulePage({ params }: { params: { attemptId: string } }) {
  const user = await requireUser();

  const attempt = await prisma.testAttempt.findUnique({
    where: { id: params.attemptId },
    include: { test: true },
  });
  if (!attempt || attempt.userId !== user.id) notFound();
  if (attempt.status !== "IN_PROGRESS") redirect(`/dashboard/attempts/${attempt.id}`);

  const moduleRow = await prisma.module.findFirst({
    where: { testId: attempt.testId, type: "SPEAKING" },
    include: { speakingParts: { orderBy: { partNumber: "asc" } } },
  });
  if (!moduleRow || moduleRow.speakingParts.length === 0) notFound();

  const nextModule = await resolveNextModuleHref(attempt.testId, attempt.id, "SPEAKING");

  return (
    <SpeakingEngineClientWrapper
      attemptId={attempt.id}
      moduleId={moduleRow.id}
      testType={attempt.test.type}
      parts={moduleRow.speakingParts.map((p) => ({
        id: p.id,
        partNumber: p.partNumber as 1 | 2 | 3,
        cueCardText: p.cueCardText ?? undefined,
        prepTimeSeconds: p.prepTimeSeconds ?? undefined,
        speakingTimeSeconds: p.speakingTimeSeconds ?? undefined,
        questions: p.questions as string[],
      }))}
      nextModule={nextModule}
    />
  );
}
