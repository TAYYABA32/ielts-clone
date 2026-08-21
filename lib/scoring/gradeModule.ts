import type {
  GradableModule,
  Question,
  TestType,
  ModuleType,
  UserAnswerMap,
} from "@/types/test";
import { rawToBand } from "./bandScoreTables";

export interface QuestionResult {
  questionId: string;
  isCorrect: boolean;
  pointsAwarded: number;
  pointsPossible: number;
  userAnswer: string | string[] | undefined;
  correctAnswer: string | string[];
}

export interface ModuleGradeResult {
  rawScore: number;
  maxRawScore: number;
  bandScore: number;
  questionResults: QuestionResult[];
}

function normalize(value: string, caseSensitive = false): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  return caseSensitive ? trimmed : trimmed.toLowerCase();
}

function arraysEqualAsSets(a: string[], b: string[], caseSensitive = false): boolean {
  if (a.length !== b.length) return false;
  const normA = new Set(a.map((v) => normalize(v, caseSensitive)));
  const normB = new Set(b.map((v) => normalize(v, caseSensitive)));
  if (normA.size !== normB.size) return false;
  for (const v of normA) if (!normB.has(v)) return false;
  return true;
}

/**
 * Compares a single user answer against a question's answer key.
 * Every question type in the schema funnels through here so grading logic
 * lives in exactly one place.
 */
export function isAnswerCorrect(question: Question, userAnswer: string | string[] | undefined): boolean {
  if (userAnswer === undefined) return false;

  switch (question.type) {
    case "MULTIPLE_CHOICE": {
      const correct = question.correctAnswer;
      if (Array.isArray(correct) || question.allowMultipleSelect) {
        const correctArr = Array.isArray(correct) ? correct : [correct];
        const userArr = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
        return arraysEqualAsSets(correctArr, userArr, true); // option keys are single letters, case-insensitivity irrelevant
      }
      const userStr = Array.isArray(userAnswer) ? userAnswer[0] : userAnswer;
      return normalize(userStr ?? "", true) === normalize(correct as string, true);
    }

    case "TRUE_FALSE_NOT_GIVEN": {
      const userStr = Array.isArray(userAnswer) ? userAnswer[0] : userAnswer;
      return normalize(userStr ?? "", true) === normalize(question.correctAnswer, true);
    }

    case "MATCHING_HEADINGS": {
      const userStr = Array.isArray(userAnswer) ? userAnswer[0] : userAnswer;
      return normalize(userStr ?? "") === normalize(question.correctAnswer);
    }

    case "SENTENCE_COMPLETION": {
      const userStr = Array.isArray(userAnswer) ? userAnswer[0] : userAnswer;
      if (userStr === undefined) return false;
      const acceptable = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer];
      return acceptable.some((a) => normalize(a, question.caseSensitive) === normalize(userStr, question.caseSensitive));
    }

    case "MAP_LABELING": {
      const userStr = Array.isArray(userAnswer) ? userAnswer[0] : userAnswer;
      return normalize(userStr ?? "") === normalize(question.correctAnswer);
    }

    default: {
      const _exhaustive: never = question;
      return _exhaustive;
    }
  }
}

/**
 * Grades a full Reading or Listening module: compares the submitted answer
 * JSON against the module's embedded answer keys, sums raw points, and maps
 * the raw score to a 1.0-9.0 band using the appropriate conversion table.
 */
export function gradeModule(
  module: GradableModule,
  userAnswers: UserAnswerMap,
  testType: TestType,
  moduleType: Extract<ModuleType, "LISTENING" | "READING">
): ModuleGradeResult {
  const questionResults: QuestionResult[] = [];
  let rawScore = 0;
  let maxRawScore = 0;

  for (const group of module.questionGroups) {
    for (const question of group.questions) {
      const userAnswer = userAnswers[question.id];
      const correct = isAnswerCorrect(question, userAnswer);
      const pointsAwarded = correct ? question.points : 0;

      rawScore += pointsAwarded;
      maxRawScore += question.points;

      questionResults.push({
        questionId: question.id,
        isCorrect: correct,
        pointsAwarded,
        pointsPossible: question.points,
        userAnswer,
        correctAnswer: question.correctAnswer,
      });
    }
  }

  const bandScore = rawToBand(rawScore, testType, moduleType);

  return { rawScore, maxRawScore, bandScore, questionResults };
}
