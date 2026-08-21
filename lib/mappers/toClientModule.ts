import type {
  ClientGradableModule,
  ClientQuestion,
  ClientQuestionGroup,
  GradableModule,
  Question,
  QuestionGroup,
} from "@/types/test";

function stripAnswer(question: Question): ClientQuestion {
  switch (question.type) {
    case "MULTIPLE_CHOICE": {
      const { correctAnswer, ...rest } = question;
      return rest;
    }
    case "TRUE_FALSE_NOT_GIVEN": {
      const { correctAnswer, ...rest } = question;
      return rest;
    }
    case "MATCHING_HEADINGS": {
      const { correctAnswer, ...rest } = question;
      return rest;
    }
    case "SENTENCE_COMPLETION": {
      const { correctAnswer, ...rest } = question;
      return rest;
    }
    case "MAP_LABELING": {
      const { correctAnswer, ...rest } = question;
      return rest;
    }
    default: {
      const _exhaustive: never = question;
      return _exhaustive;
    }
  }
}

function stripGroup(group: QuestionGroup): ClientQuestionGroup {
  return { ...group, questions: group.questions.map(stripAnswer) };
}

/**
 * Strips every Question.correctAnswer out of a GradableModule. This is the
 * ONLY module shape allowed to reach a "use client" component — the full
 * GradableModule (with answer keys) must stay server-side, read fresh from
 * Prisma and used exclusively by gradeModule() at submit time. Never pass a
 * GradableModule as a prop to a client component; pass the result of this
 * function instead.
 */
export function toClientModule(module: GradableModule): ClientGradableModule {
  const questionGroups = module.questionGroups.map(stripGroup);

  if ("passages" in module) {
    return { timeLimitMinutes: module.timeLimitMinutes, passages: module.passages, questionGroups };
  }
  return { timeLimitMinutes: module.timeLimitMinutes, audioTracks: module.audioTracks, questionGroups };
}
