import { randomUUID } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import type { ModuleInput, QuestionGroupInput, QuestionInput } from "@/lib/validation/testSchemas";

type TxClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

function extractQuestionData(question: QuestionInput): Record<string, unknown> {
  switch (question.type) {
    case "MULTIPLE_CHOICE":
      return { options: question.options, allowMultipleSelect: question.allowMultipleSelect };
    case "TRUE_FALSE_NOT_GIVEN":
      return { statement: question.statement };
    case "MATCHING_HEADINGS":
      return { paragraphLabel: question.paragraphLabel };
    case "SENTENCE_COMPLETION":
      return { textWithBlank: question.textWithBlank, maxWords: question.maxWords, caseSensitive: question.caseSensitive };
    case "MAP_LABELING":
      return { labelPointId: question.labelPointId };
  }
}

async function syncQuestions(tx: TxClient, groupId: string, questions: QuestionInput[]) {
  const incomingIds = new Set(questions.map((q) => q.id).filter((id): id is string => Boolean(id)));

  await tx.question.deleteMany({ where: { groupId, id: { notIn: Array.from(incomingIds) } } });

  for (const question of questions) {
    const id = question.id ?? randomUUID();
    await tx.question.upsert({
      where: { id },
      create: {
        id,
        groupId,
        order: question.order,
        prompt: question.prompt,
        points: question.points,
        data: extractQuestionData(question) as Prisma.InputJsonValue,
        correctAnswer: question.correctAnswer as Prisma.InputJsonValue,
      },
      update: {
        order: question.order,
        prompt: question.prompt,
        points: question.points,
        data: extractQuestionData(question) as Prisma.InputJsonValue,
        correctAnswer: question.correctAnswer as Prisma.InputJsonValue,
      },
    });
  }
}

async function syncQuestionGroups(tx: TxClient, moduleId: string, groups: QuestionGroupInput[]) {
  const incomingIds = new Set(groups.map((g) => g.id).filter((id): id is string => Boolean(id)));

  // Cascade in the Prisma schema removes each group's questions automatically.
  await tx.questionGroup.deleteMany({ where: { moduleId, id: { notIn: Array.from(incomingIds) } } });

  for (const group of groups) {
    const id = group.id ?? randomUUID();
    await tx.questionGroup.upsert({
      where: { id },
      create: {
        id,
        moduleId,
        passageId: group.passageId,
        audioTrackId: group.audioTrackId,
        type: group.type,
        order: group.order,
        instructions: group.instructions,
        groupData: (group.groupData ?? undefined) as Prisma.InputJsonValue | undefined,
      },
      update: {
        passageId: group.passageId ?? null,
        audioTrackId: group.audioTrackId ?? null,
        type: group.type,
        order: group.order,
        instructions: group.instructions,
        groupData: (group.groupData ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });

    await syncQuestions(tx, id, group.questions);
  }
}

/**
 * Replace-on-save sync for a module's full nested content tree (passages,
 * audio tracks, question groups + questions, writing tasks, speaking parts).
 * The Test Builder form always submits the complete current state of a
 * module, so anything present in the DB but absent from the payload is
 * treated as deleted by the editor and removed.
 */
export async function syncModuleContent(tx: TxClient, moduleId: string, input: ModuleInput) {
  await tx.module.update({
    where: { id: moduleId },
    data: { order: input.order, timeLimitMinutes: input.timeLimitMinutes },
  });

  if (input.passages) {
    const incomingIds = new Set(input.passages.map((p) => p.id).filter((id): id is string => Boolean(id)));
    await tx.passage.deleteMany({ where: { moduleId, id: { notIn: Array.from(incomingIds) } } });
    for (const passage of input.passages) {
      const id = passage.id ?? randomUUID();
      await tx.passage.upsert({
        where: { id },
        create: { id, moduleId, order: passage.order, title: passage.title, bodyText: passage.bodyText },
        update: { order: passage.order, title: passage.title, bodyText: passage.bodyText },
      });
    }
  }

  if (input.audioTracks) {
    const incomingIds = new Set(input.audioTracks.map((a) => a.id).filter((id): id is string => Boolean(id)));
    await tx.audioTrack.deleteMany({ where: { moduleId, id: { notIn: Array.from(incomingIds) } } });
    for (const track of input.audioTracks) {
      const id = track.id ?? randomUUID();
      await tx.audioTrack.upsert({
        where: { id },
        create: {
          id,
          moduleId,
          order: track.order,
          title: track.title,
          audioUrl: track.audioUrl,
          durationSeconds: track.durationSeconds,
          transcript: track.transcript,
        },
        update: {
          order: track.order,
          title: track.title,
          audioUrl: track.audioUrl,
          durationSeconds: track.durationSeconds,
          transcript: track.transcript,
        },
      });
    }
  }

  if (input.writingTasks) {
    for (const task of input.writingTasks) {
      const id = task.id ?? randomUUID();
      await tx.writingTask.upsert({
        where: { id },
        create: {
          id,
          moduleId,
          taskNumber: task.taskNumber,
          prompt: task.prompt,
          imageUrl: task.imageUrl,
          minWords: task.minWords,
          timeLimitMinutes: task.timeLimitMinutes,
        },
        update: {
          taskNumber: task.taskNumber,
          prompt: task.prompt,
          imageUrl: task.imageUrl,
          minWords: task.minWords,
          timeLimitMinutes: task.timeLimitMinutes,
        },
      });
    }
  }

  if (input.speakingParts) {
    for (const part of input.speakingParts) {
      const id = part.id ?? randomUUID();
      await tx.speakingPart.upsert({
        where: { id },
        create: {
          id,
          moduleId,
          partNumber: part.partNumber,
          cueCardText: part.cueCardText,
          prepTimeSeconds: part.prepTimeSeconds,
          speakingTimeSeconds: part.speakingTimeSeconds,
          questions: part.questions as Prisma.InputJsonValue,
        },
        update: {
          partNumber: part.partNumber,
          cueCardText: part.cueCardText,
          prepTimeSeconds: part.prepTimeSeconds,
          speakingTimeSeconds: part.speakingTimeSeconds,
          questions: part.questions as Prisma.InputJsonValue,
        },
      });
    }
  }

  if (input.questionGroups) {
    await syncQuestionGroups(tx, moduleId, input.questionGroups);
  }
}
