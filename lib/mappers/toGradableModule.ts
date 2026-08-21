import type { Prisma, QuestionGroup as PrismaQuestionGroup, Question as PrismaQuestion } from "@prisma/client";
import type {
  GradableModule,
  ListeningModule,
  Question,
  QuestionGroup,
  QuestionGroupData,
  ReadingModule,
} from "@/types/test";

type ModuleWithRelations = Prisma.ModuleGetPayload<{
  include: {
    passages: true;
    audioTracks: true;
    questionGroups: { include: { questions: true } };
  };
}>;

function toQuestion(row: PrismaQuestion, groupType: PrismaQuestionGroup["type"]): Question {
  const data = (row.data ?? {}) as Record<string, unknown>;
  const base = {
    id: row.id,
    order: row.order,
    points: row.points,
    prompt: row.prompt ?? undefined,
  };

  switch (groupType) {
    case "MULTIPLE_CHOICE":
      return {
        ...base,
        type: "MULTIPLE_CHOICE",
        options: (data.options as Question extends { options: infer O } ? O : never) ?? [],
        allowMultipleSelect: Boolean(data.allowMultipleSelect),
        correctAnswer: row.correctAnswer as string | string[],
      };
    case "TRUE_FALSE_NOT_GIVEN":
      return {
        ...base,
        type: "TRUE_FALSE_NOT_GIVEN",
        statement: (data.statement as string) ?? "",
        correctAnswer: row.correctAnswer as "TRUE" | "FALSE" | "NOT_GIVEN",
      };
    case "MATCHING_HEADINGS":
      return {
        ...base,
        type: "MATCHING_HEADINGS",
        paragraphLabel: (data.paragraphLabel as string) ?? "",
        correctAnswer: row.correctAnswer as string,
      };
    case "SENTENCE_COMPLETION":
      return {
        ...base,
        type: "SENTENCE_COMPLETION",
        textWithBlank: (data.textWithBlank as string) ?? "",
        maxWords: (data.maxWords as number) ?? 3,
        caseSensitive: Boolean(data.caseSensitive),
        correctAnswer: row.correctAnswer as string | string[],
      };
    case "MAP_LABELING":
      return {
        ...base,
        type: "MAP_LABELING",
        labelPointId: (data.labelPointId as string) ?? "",
        correctAnswer: row.correctAnswer as string,
      };
    default: {
      const _exhaustive: never = groupType;
      throw new Error(`Unknown question group type: ${_exhaustive}`);
    }
  }
}

function toQuestionGroup(row: PrismaQuestionGroup & { questions: PrismaQuestion[] }): QuestionGroup {
  return {
    id: row.id,
    order: row.order,
    type: row.type,
    instructions: row.instructions,
    passageId: row.passageId ?? undefined,
    audioTrackId: row.audioTrackId ?? undefined,
    groupData: (row.groupData ?? undefined) as QuestionGroupData | undefined,
    questions: row.questions
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((q) => toQuestion(q, row.type)),
  };
}

/** Rehydrates a Prisma Module (+ relations) into the engine's GradableModule shape used by gradeModule(). */
export function toGradableModule(module: ModuleWithRelations): GradableModule {
  const questionGroups = module.questionGroups
    .slice()
    .sort((a, b) => a.order - b.order)
    .map(toQuestionGroup);

  if (module.type === "READING") {
    const reading: ReadingModule = {
      timeLimitMinutes: module.timeLimitMinutes,
      passages: module.passages
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((p) => ({ id: p.id, order: p.order, title: p.title, bodyText: p.bodyText })),
      questionGroups,
    };
    return reading;
  }

  if (module.type === "LISTENING") {
    const listening: ListeningModule = {
      timeLimitMinutes: module.timeLimitMinutes,
      audioTracks: module.audioTracks
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((t) => ({
          id: t.id,
          order: t.order,
          title: t.title,
          audioUrl: t.audioUrl,
          durationSeconds: t.durationSeconds,
          transcript: t.transcript ?? undefined,
        })),
      questionGroups,
    };
    return listening;
  }

  throw new Error(`toGradableModule only supports READING/LISTENING, got ${module.type}`);
}

export type { ModuleWithRelations };
