import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { TestBuilderForm, type LoadedModule } from "@/components/admin/TestBuilderForm";
import type { ModuleInput } from "@/lib/validation/testSchemas";

function toModuleInput(module: Awaited<ReturnType<typeof loadTest>>["modules"][number]): ModuleInput {
  return {
    id: module.id,
    type: module.type,
    order: module.order,
    timeLimitMinutes: module.timeLimitMinutes,
    passages: module.passages.map((p) => ({ id: p.id, order: p.order, title: p.title, bodyText: p.bodyText })),
    audioTracks: module.audioTracks.map((t) => ({
      id: t.id,
      order: t.order,
      title: t.title,
      audioUrl: t.audioUrl,
      durationSeconds: t.durationSeconds,
      transcript: t.transcript ?? undefined,
    })),
    questionGroups: module.questionGroups.map((g) => ({
      id: g.id,
      order: g.order,
      type: g.type,
      instructions: g.instructions,
      passageId: g.passageId ?? undefined,
      audioTrackId: g.audioTrackId ?? undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- groupData/data/correctAnswer are Prisma Json columns; shape is validated on write via zod, not re-validated on read
      groupData: (g.groupData ?? undefined) as any,
      questions: g.questions.map((q) => ({
        id: q.id,
        order: q.order,
        points: q.points,
        prompt: q.prompt ?? undefined,
        type: g.type,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see groupData justification above
        ...(q.data as any),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see groupData justification above
        correctAnswer: q.correctAnswer as any,
      })),
    })) as ModuleInput["questionGroups"],
    writingTasks: module.writingTasks.map((w) => ({
      id: w.id,
      taskNumber: w.taskNumber as 1 | 2,
      prompt: w.prompt,
      imageUrl: w.imageUrl ?? undefined,
      minWords: w.minWords,
      timeLimitMinutes: w.timeLimitMinutes,
    })),
    speakingParts: module.speakingParts.map((s) => ({
      id: s.id,
      partNumber: s.partNumber as 1 | 2 | 3,
      cueCardText: s.cueCardText ?? undefined,
      prepTimeSeconds: s.prepTimeSeconds ?? undefined,
      speakingTimeSeconds: s.speakingTimeSeconds ?? undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      questions: s.questions as any,
    })),
  };
}

async function loadTest(testId: string) {
  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: {
      modules: {
        include: {
          passages: { orderBy: { order: "asc" } },
          audioTracks: { orderBy: { order: "asc" } },
          writingTasks: true,
          speakingParts: true,
          questionGroups: { include: { questions: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } },
        },
      },
    },
  });
  if (!test) notFound();
  return test;
}

export default async function TestBuilderPage({ params }: { params: { testId: string } }) {
  await requireAdmin();
  const test = await loadTest(params.testId);

  const existingModules: Partial<Record<ModuleInput["type"], LoadedModule>> = {};
  for (const moduleRow of test.modules) {
    existingModules[moduleRow.type] = { id: moduleRow.id, data: toModuleInput(moduleRow) };
  }

  return <TestBuilderForm testId={test.id} testTitle={test.title} existingModules={existingModules} />;
}
