import { describe, expect, it } from "vitest";
import { gradeModule, isAnswerCorrect } from "./gradeModule";
import { rawToBand } from "./bandScoreTables";
import type {
  GradableModule,
  MapLabelingQuestion,
  MatchingHeadingsQuestion,
  MultipleChoiceQuestion,
  Question,
  QuestionGroup,
  SentenceCompletionQuestion,
  TrueFalseNotGivenQuestion,
} from "@/types/test";

function mcq(overrides: Partial<MultipleChoiceQuestion> = {}): MultipleChoiceQuestion {
  return {
    id: "q-mcq",
    order: 1,
    type: "MULTIPLE_CHOICE",
    points: 1,
    allowMultipleSelect: false,
    options: [
      { key: "A", text: "Option A" },
      { key: "B", text: "Option B" },
      { key: "C", text: "Option C" },
    ],
    correctAnswer: "B",
    ...overrides,
  };
}

function tfng(overrides: Partial<TrueFalseNotGivenQuestion> = {}): TrueFalseNotGivenQuestion {
  return {
    id: "q-tfng",
    order: 1,
    type: "TRUE_FALSE_NOT_GIVEN",
    points: 1,
    statement: "The sky is blue.",
    correctAnswer: "TRUE",
    ...overrides,
  };
}

function matchingHeadings(overrides: Partial<MatchingHeadingsQuestion> = {}): MatchingHeadingsQuestion {
  return {
    id: "q-mh",
    order: 1,
    type: "MATCHING_HEADINGS",
    points: 1,
    paragraphLabel: "Paragraph A",
    correctAnswer: "iv",
    ...overrides,
  };
}

function sentenceCompletion(overrides: Partial<SentenceCompletionQuestion> = {}): SentenceCompletionQuestion {
  return {
    id: "q-sc",
    order: 1,
    type: "SENTENCE_COMPLETION",
    points: 1,
    textWithBlank: "The capital of France is ___.",
    maxWords: 3,
    correctAnswer: "Paris",
    caseSensitive: false,
    ...overrides,
  };
}

function mapLabeling(overrides: Partial<MapLabelingQuestion> = {}): MapLabelingQuestion {
  return {
    id: "q-ml",
    order: 1,
    type: "MAP_LABELING",
    points: 1,
    labelPointId: "point-1",
    correctAnswer: "C",
    ...overrides,
  };
}

describe("isAnswerCorrect", () => {
  it("is false for every question type when the answer is undefined", () => {
    expect(isAnswerCorrect(mcq(), undefined)).toBe(false);
    expect(isAnswerCorrect(tfng(), undefined)).toBe(false);
    expect(isAnswerCorrect(matchingHeadings(), undefined)).toBe(false);
    expect(isAnswerCorrect(sentenceCompletion(), undefined)).toBe(false);
    expect(isAnswerCorrect(mapLabeling(), undefined)).toBe(false);
  });

  describe("MULTIPLE_CHOICE", () => {
    it("marks the correct single-select option key correct", () => {
      expect(isAnswerCorrect(mcq({ correctAnswer: "B" }), "B")).toBe(true);
    });

    it("marks a wrong single-select option key incorrect", () => {
      expect(isAnswerCorrect(mcq({ correctAnswer: "B" }), "A")).toBe(false);
    });

    it("matches a multi-select answer regardless of submitted order", () => {
      const q = mcq({ allowMultipleSelect: true, correctAnswer: ["A", "C"] });
      expect(isAnswerCorrect(q, ["C", "A"])).toBe(true);
    });

    it("rejects a multi-select answer missing one required option", () => {
      const q = mcq({ allowMultipleSelect: true, correctAnswer: ["A", "C"] });
      expect(isAnswerCorrect(q, ["A"])).toBe(false);
    });

    it("rejects a multi-select answer with an extra, unrequired option", () => {
      const q = mcq({ allowMultipleSelect: true, correctAnswer: ["A", "C"] });
      expect(isAnswerCorrect(q, ["A", "B", "C"])).toBe(false);
    });

    it("does not let duplicate submitted keys stand in for a second required option", () => {
      const q = mcq({ allowMultipleSelect: true, correctAnswer: ["A", "C"] });
      expect(isAnswerCorrect(q, ["A", "A"])).toBe(false);
    });

    it("treats an array correctAnswer as multi-select even if allowMultipleSelect is false", () => {
      const q = mcq({ allowMultipleSelect: false, correctAnswer: ["A", "C"] });
      expect(isAnswerCorrect(q, ["C", "A"])).toBe(true);
    });
  });

  describe("TRUE_FALSE_NOT_GIVEN", () => {
    it("matches the exact correct value", () => {
      expect(isAnswerCorrect(tfng({ correctAnswer: "NOT_GIVEN" }), "NOT_GIVEN")).toBe(true);
    });

    it("rejects a different value", () => {
      expect(isAnswerCorrect(tfng({ correctAnswer: "TRUE" }), "FALSE")).toBe(false);
    });

    it("is case-sensitive — lowercase input does not match the canonical uppercase value", () => {
      expect(isAnswerCorrect(tfng({ correctAnswer: "TRUE" }), "true")).toBe(false);
    });
  });

  describe("MATCHING_HEADINGS", () => {
    it("matches the correct heading key", () => {
      expect(isAnswerCorrect(matchingHeadings({ correctAnswer: "iv" }), "iv")).toBe(true);
    });

    it("is case-insensitive", () => {
      expect(isAnswerCorrect(matchingHeadings({ correctAnswer: "iv" }), "IV")).toBe(true);
    });

    it("rejects a wrong heading key", () => {
      expect(isAnswerCorrect(matchingHeadings({ correctAnswer: "iv" }), "v")).toBe(false);
    });
  });

  describe("SENTENCE_COMPLETION", () => {
    it("matches when case-insensitive by default and case differs", () => {
      expect(isAnswerCorrect(sentenceCompletion({ correctAnswer: "Paris", caseSensitive: false }), "paris")).toBe(true);
    });

    it("rejects a case mismatch when caseSensitive is true", () => {
      expect(isAnswerCorrect(sentenceCompletion({ correctAnswer: "Paris", caseSensitive: true }), "paris")).toBe(false);
    });

    it("accepts any one of multiple acceptable answers", () => {
      const q = sentenceCompletion({ correctAnswer: ["colour", "color"] });
      expect(isAnswerCorrect(q, "color")).toBe(true);
      expect(isAnswerCorrect(q, "colour")).toBe(true);
      expect(isAnswerCorrect(q, "colr")).toBe(false);
    });

    it("collapses internal whitespace before comparing", () => {
      expect(isAnswerCorrect(sentenceCompletion({ correctAnswer: "New York" }), "New   York")).toBe(true);
    });

    it("trims leading/trailing whitespace before comparing", () => {
      expect(isAnswerCorrect(sentenceCompletion({ correctAnswer: "Paris" }), "  Paris  ")).toBe(true);
    });
  });

  describe("MAP_LABELING", () => {
    it("matches the correct label key case-insensitively", () => {
      expect(isAnswerCorrect(mapLabeling({ correctAnswer: "C" }), "c")).toBe(true);
    });

    it("rejects a wrong label key", () => {
      expect(isAnswerCorrect(mapLabeling({ correctAnswer: "C" }), "D")).toBe(false);
    });
  });
});

function moduleWith(questions: Question[]): GradableModule {
  const first = questions[0];
  if (!first) throw new Error("moduleWith requires at least one question");

  const group: QuestionGroup = {
    id: "group-1",
    order: 1,
    type: first.type,
    instructions: "Answer the following.",
    questions,
  };
  return { timeLimitMinutes: 30, passages: [], questionGroups: [group] };
}

describe("gradeModule", () => {
  it("awards full points and a perfect band when every question is correct", () => {
    const questions = [mcq({ id: "1", correctAnswer: "A" }), mcq({ id: "2", correctAnswer: "B", order: 2 })];
    const result = gradeModule(moduleWith(questions), { "1": "A", "2": "B" }, "ACADEMIC", "READING");

    expect(result.rawScore).toBe(2);
    expect(result.maxRawScore).toBe(2);
    expect(result.questionResults).toHaveLength(2);
    expect(result.questionResults.every((q) => q.isCorrect)).toBe(true);
  });

  it("counts an unanswered question toward maxRawScore but not rawScore", () => {
    const questions = [mcq({ id: "1", correctAnswer: "A" }), mcq({ id: "2", correctAnswer: "B", order: 2 })];
    const result = gradeModule(moduleWith(questions), { "1": "A" }, "ACADEMIC", "READING");

    expect(result.rawScore).toBe(1);
    expect(result.maxRawScore).toBe(2);
    const unanswered = result.questionResults.find((q) => q.questionId === "2")!;
    expect(unanswered.isCorrect).toBe(false);
    expect(unanswered.userAnswer).toBeUndefined();
  });

  it("weights rawScore/maxRawScore by each question's points value, not just question count", () => {
    const questions = [
      mcq({ id: "1", correctAnswer: "A", points: 3 }),
      mcq({ id: "2", correctAnswer: "B", order: 2, points: 1 }),
    ];
    // Only the 3-point question answered correctly.
    const result = gradeModule(moduleWith(questions), { "1": "A", "2": "WRONG" }, "ACADEMIC", "READING");

    expect(result.rawScore).toBe(3);
    expect(result.maxRawScore).toBe(4);
  });

  it("derives bandScore from rawToBand for the given test/module type", () => {
    const questions = [mcq({ id: "1", correctAnswer: "A" })];
    const result = gradeModule(moduleWith(questions), { "1": "A" }, "GENERAL", "READING");

    expect(result.bandScore).toBe(rawToBand(result.rawScore, "GENERAL", "READING"));
  });

  it("scores zero correct answers as a valid (low) band rather than throwing", () => {
    const questions = [mcq({ id: "1", correctAnswer: "A" })];
    const result = gradeModule(moduleWith(questions), { "1": "WRONG" }, "ACADEMIC", "LISTENING");

    expect(result.rawScore).toBe(0);
    expect(result.bandScore).toBe(rawToBand(0, "ACADEMIC", "LISTENING"));
  });

  it("includes each question's correctAnswer in the result for post-submission review", () => {
    const questions = [mcq({ id: "1", correctAnswer: "A" })];
    const result = gradeModule(moduleWith(questions), { "1": "A" }, "ACADEMIC", "READING");

    expect(result.questionResults[0]?.correctAnswer).toBe("A");
  });

  it("grades across multiple question groups, not just the first", () => {
    const groupA: QuestionGroup = {
      id: "group-a",
      order: 1,
      type: "MULTIPLE_CHOICE",
      instructions: "Section A",
      questions: [mcq({ id: "a1", correctAnswer: "A" })],
    };
    const groupB: QuestionGroup = {
      id: "group-b",
      order: 2,
      type: "TRUE_FALSE_NOT_GIVEN",
      instructions: "Section B",
      questions: [tfng({ id: "b1", correctAnswer: "TRUE" })],
    };
    const gradableModule: GradableModule = { timeLimitMinutes: 30, passages: [], questionGroups: [groupA, groupB] };

    const result = gradeModule(gradableModule, { a1: "A", b1: "TRUE" }, "ACADEMIC", "READING");

    expect(result.rawScore).toBe(2);
    expect(result.questionResults.map((q) => q.questionId).sort()).toEqual(["a1", "b1"]);
  });
});
