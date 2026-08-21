import { describe, expect, it } from "vitest";
import {
  audioTrackSchema,
  createTestSchema,
  mapLabelingQuestionSchema,
  matchingHeadingsQuestionSchema,
  moduleSchema,
  multipleChoiceQuestionSchema,
  optionItemSchema,
  passageSchema,
  questionGroupSchema,
  questionSchema,
  sentenceCompletionQuestionSchema,
  speakingPartSchema,
  trueFalseNotGivenQuestionSchema,
  updateTestSchema,
  writingTaskSchema,
} from "./testSchemas";

describe("optionItemSchema", () => {
  it("accepts a valid single/double-letter key", () => {
    expect(optionItemSchema.safeParse({ key: "A", text: "Option A" }).success).toBe(true);
    expect(optionItemSchema.safeParse({ key: "AB", text: "Option AB" }).success).toBe(true);
  });

  it("rejects an empty key", () => {
    expect(optionItemSchema.safeParse({ key: "", text: "Option A" }).success).toBe(false);
  });

  it("rejects a key longer than 2 characters", () => {
    expect(optionItemSchema.safeParse({ key: "ABC", text: "Option A" }).success).toBe(false);
  });

  it("rejects empty text", () => {
    expect(optionItemSchema.safeParse({ key: "A", text: "" }).success).toBe(false);
  });
});

describe("multipleChoiceQuestionSchema", () => {
  const base = {
    type: "MULTIPLE_CHOICE" as const,
    order: 1,
    options: [
      { key: "A", text: "Option A" },
      { key: "B", text: "Option B" },
    ],
    correctAnswer: "A",
  };

  it("accepts a minimal valid question and defaults allowMultipleSelect/points", () => {
    const result = multipleChoiceQuestionSchema.parse(base);
    expect(result.allowMultipleSelect).toBe(false);
    expect(result.points).toBe(1);
  });

  it("accepts an array correctAnswer for multi-select", () => {
    expect(multipleChoiceQuestionSchema.safeParse({ ...base, allowMultipleSelect: true, correctAnswer: ["A", "B"] }).success).toBe(true);
  });

  it("rejects fewer than 2 options", () => {
    expect(multipleChoiceQuestionSchema.safeParse({ ...base, options: [{ key: "A", text: "Only option" }] }).success).toBe(false);
  });

  it("rejects order below 1", () => {
    expect(multipleChoiceQuestionSchema.safeParse({ ...base, order: 0 }).success).toBe(false);
  });

  it("rejects a negative points value", () => {
    expect(multipleChoiceQuestionSchema.safeParse({ ...base, points: -1 }).success).toBe(false);
  });

  it("rejects an empty array correctAnswer", () => {
    expect(multipleChoiceQuestionSchema.safeParse({ ...base, correctAnswer: [] }).success).toBe(false);
  });
});

describe("trueFalseNotGivenQuestionSchema", () => {
  const base = { type: "TRUE_FALSE_NOT_GIVEN" as const, order: 1, statement: "The Earth is round.", correctAnswer: "TRUE" as const };

  it("accepts each of the three valid correctAnswer values", () => {
    for (const correctAnswer of ["TRUE", "FALSE", "NOT_GIVEN"] as const) {
      expect(trueFalseNotGivenQuestionSchema.safeParse({ ...base, correctAnswer }).success).toBe(true);
    }
  });

  it("rejects a correctAnswer outside the enum", () => {
    expect(trueFalseNotGivenQuestionSchema.safeParse({ ...base, correctAnswer: "MAYBE" }).success).toBe(false);
  });

  it("rejects an empty statement", () => {
    expect(trueFalseNotGivenQuestionSchema.safeParse({ ...base, statement: "" }).success).toBe(false);
  });
});

describe("sentenceCompletionQuestionSchema", () => {
  const base = {
    type: "SENTENCE_COMPLETION" as const,
    order: 1,
    textWithBlank: "The capital of France is ___.",
    correctAnswer: "Paris",
  };

  it("accepts a valid blank and defaults maxWords/caseSensitive", () => {
    const result = sentenceCompletionQuestionSchema.parse(base);
    expect(result.maxWords).toBe(3);
    expect(result.caseSensitive).toBe(false);
  });

  it("rejects textWithBlank missing the ___ placeholder", () => {
    expect(sentenceCompletionQuestionSchema.safeParse({ ...base, textWithBlank: "No blank here." }).success).toBe(false);
  });

  it("accepts an array of acceptable answers", () => {
    expect(sentenceCompletionQuestionSchema.safeParse({ ...base, correctAnswer: ["colour", "color"] }).success).toBe(true);
  });

  it("rejects maxWords below 1", () => {
    expect(sentenceCompletionQuestionSchema.safeParse({ ...base, maxWords: 0 }).success).toBe(false);
  });
});

describe("matchingHeadingsQuestionSchema", () => {
  const base = { type: "MATCHING_HEADINGS" as const, order: 1, paragraphLabel: "Paragraph A", correctAnswer: "iv" };

  it("accepts a valid question", () => {
    expect(matchingHeadingsQuestionSchema.safeParse(base).success).toBe(true);
  });

  it("rejects an empty paragraphLabel", () => {
    expect(matchingHeadingsQuestionSchema.safeParse({ ...base, paragraphLabel: "" }).success).toBe(false);
  });

  it("rejects an empty correctAnswer", () => {
    expect(matchingHeadingsQuestionSchema.safeParse({ ...base, correctAnswer: "" }).success).toBe(false);
  });
});

describe("mapLabelingQuestionSchema", () => {
  const base = { type: "MAP_LABELING" as const, order: 1, labelPointId: "point-1", correctAnswer: "A" };

  it("accepts a valid question", () => {
    expect(mapLabelingQuestionSchema.safeParse(base).success).toBe(true);
  });

  it("rejects an empty labelPointId", () => {
    expect(mapLabelingQuestionSchema.safeParse({ ...base, labelPointId: "" }).success).toBe(false);
  });
});

describe("questionSchema (discriminated union)", () => {
  it("routes to the correct branch based on `type` and rejects a payload matching the wrong branch's shape", () => {
    // A MATCHING_HEADINGS-shaped payload tagged as MULTIPLE_CHOICE is missing `options`.
    const wrongShape = { type: "MULTIPLE_CHOICE", order: 1, paragraphLabel: "A", correctAnswer: "iv" };
    expect(questionSchema.safeParse(wrongShape).success).toBe(false);
  });

  it("rejects an unknown discriminant value", () => {
    expect(questionSchema.safeParse({ type: "ESSAY", order: 1 }).success).toBe(false);
  });
});

describe("questionGroupSchema", () => {
  const mcQuestion = {
    type: "MULTIPLE_CHOICE" as const,
    order: 1,
    options: [
      { key: "A", text: "A" },
      { key: "B", text: "B" },
    ],
    correctAnswer: "A",
  };

  it("accepts a valid MULTIPLE_CHOICE group", () => {
    const group = {
      order: 1,
      type: "MULTIPLE_CHOICE" as const,
      instructions: "Choose the best answer.",
      questions: [mcQuestion],
    };
    expect(questionGroupSchema.safeParse(group).success).toBe(true);
  });

  it("rejects a group whose question type does not match the group's own type", () => {
    const group = {
      order: 1,
      type: "TRUE_FALSE_NOT_GIVEN" as const,
      instructions: "Choose the best answer.",
      questions: [mcQuestion], // MULTIPLE_CHOICE question inside a TRUE_FALSE_NOT_GIVEN group
    };
    const result = questionGroupSchema.safeParse(group);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.join(".") === "questions.0.type")).toBe(true);
    }
  });

  it("rejects an empty questions array", () => {
    const group = { order: 1, type: "MULTIPLE_CHOICE" as const, instructions: "x", questions: [] };
    expect(questionGroupSchema.safeParse(group).success).toBe(false);
  });

  it("rejects a MATCHING_HEADINGS group missing groupData.headings", () => {
    const group = {
      order: 1,
      type: "MATCHING_HEADINGS" as const,
      instructions: "Match the headings.",
      questions: [{ type: "MATCHING_HEADINGS" as const, order: 1, paragraphLabel: "A", correctAnswer: "iv" }],
    };
    const result = questionGroupSchema.safeParse(group);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.join(".") === "groupData.headings")).toBe(true);
    }
  });

  it("accepts a MATCHING_HEADINGS group with groupData.headings present", () => {
    const group = {
      order: 1,
      type: "MATCHING_HEADINGS" as const,
      instructions: "Match the headings.",
      groupData: { headings: [{ key: "i", text: "Introduction" }] },
      questions: [{ type: "MATCHING_HEADINGS" as const, order: 1, paragraphLabel: "A", correctAnswer: "i" }],
    };
    expect(questionGroupSchema.safeParse(group).success).toBe(true);
  });

  it("rejects a MAP_LABELING group missing any of mapImageUrl/mapPoints/options", () => {
    const question = { type: "MAP_LABELING" as const, order: 1, labelPointId: "p1", correctAnswer: "A" };

    const missingEverything = { order: 1, type: "MAP_LABELING" as const, instructions: "Label the map.", questions: [question] };
    expect(questionGroupSchema.safeParse(missingEverything).success).toBe(false);

    const missingOptions = {
      order: 1,
      type: "MAP_LABELING" as const,
      instructions: "Label the map.",
      groupData: { mapImageUrl: "https://example.com/map.png", mapPoints: [{ id: "p1", x: 10, y: 20 }] },
      questions: [question],
    };
    expect(questionGroupSchema.safeParse(missingOptions).success).toBe(false);
  });

  it("accepts a MAP_LABELING group with all required groupData fields present", () => {
    const question = { type: "MAP_LABELING" as const, order: 1, labelPointId: "p1", correctAnswer: "A" };
    const group = {
      order: 1,
      type: "MAP_LABELING" as const,
      instructions: "Label the map.",
      groupData: {
        mapImageUrl: "https://example.com/map.png",
        mapPoints: [{ id: "p1", x: 10, y: 20 }],
        options: [{ key: "A", text: "River" }],
      },
      questions: [question],
    };
    expect(questionGroupSchema.safeParse(group).success).toBe(true);
  });
});

describe("mapPoint x/y bounds (via a full MAP_LABELING group)", () => {
  function groupWithPoint(x: number, y: number) {
    return {
      order: 1,
      type: "MAP_LABELING" as const,
      instructions: "Label the map.",
      groupData: {
        mapImageUrl: "https://example.com/map.png",
        mapPoints: [{ id: "p1", x, y }],
        options: [{ key: "A", text: "River" }],
      },
      questions: [{ type: "MAP_LABELING" as const, order: 1, labelPointId: "p1", correctAnswer: "A" }],
    };
  }

  it("accepts boundary values 0 and 100", () => {
    expect(questionGroupSchema.safeParse(groupWithPoint(0, 0)).success).toBe(true);
    expect(questionGroupSchema.safeParse(groupWithPoint(100, 100)).success).toBe(true);
  });

  it("rejects values outside 0-100", () => {
    expect(questionGroupSchema.safeParse(groupWithPoint(-1, 50)).success).toBe(false);
    expect(questionGroupSchema.safeParse(groupWithPoint(50, 101)).success).toBe(false);
  });
});

describe("passageSchema / audioTrackSchema", () => {
  it("accepts a valid passage", () => {
    expect(passageSchema.safeParse({ order: 1, title: "Passage 1", bodyText: "Some text." }).success).toBe(true);
  });

  it("rejects a passage with empty bodyText", () => {
    expect(passageSchema.safeParse({ order: 1, title: "Passage 1", bodyText: "" }).success).toBe(false);
  });

  it("accepts a valid audio track", () => {
    expect(
      audioTrackSchema.safeParse({ order: 1, title: "Section 1", audioUrl: "https://example.com/a.mp3", durationSeconds: 120 }).success
    ).toBe(true);
  });

  it("rejects a non-URL audioUrl", () => {
    expect(
      audioTrackSchema.safeParse({ order: 1, title: "Section 1", audioUrl: "not-a-url", durationSeconds: 120 }).success
    ).toBe(false);
  });

  it("rejects a non-positive durationSeconds", () => {
    expect(
      audioTrackSchema.safeParse({ order: 1, title: "Section 1", audioUrl: "https://example.com/a.mp3", durationSeconds: 0 }).success
    ).toBe(false);
  });
});

describe("writingTaskSchema", () => {
  const base = { taskNumber: 1 as const, prompt: "Describe the chart.", minWords: 150, timeLimitMinutes: 20 };

  it("accepts task numbers 1 and 2 only", () => {
    expect(writingTaskSchema.safeParse(base).success).toBe(true);
    expect(writingTaskSchema.safeParse({ ...base, taskNumber: 2 }).success).toBe(true);
    expect(writingTaskSchema.safeParse({ ...base, taskNumber: 3 }).success).toBe(false);
  });

  it("rejects a non-positive minWords", () => {
    expect(writingTaskSchema.safeParse({ ...base, minWords: 0 }).success).toBe(false);
  });
});

describe("speakingPartSchema", () => {
  it("accepts part numbers 1, 2, and 3 only", () => {
    const base = { partNumber: 1 as const, questions: ["Tell me about your hometown."] };
    expect(speakingPartSchema.safeParse(base).success).toBe(true);
    expect(speakingPartSchema.safeParse({ ...base, partNumber: 3 }).success).toBe(true);
    expect(speakingPartSchema.safeParse({ ...base, partNumber: 4 }).success).toBe(false);
  });

  it("allows an empty questions array (part 2 cue cards have no sub-questions)", () => {
    expect(speakingPartSchema.safeParse({ partNumber: 2, cueCardText: "Describe a place you like.", questions: [] }).success).toBe(true);
  });

  it("rejects a negative prepTimeSeconds", () => {
    expect(speakingPartSchema.safeParse({ partNumber: 2, prepTimeSeconds: -1, questions: [] }).success).toBe(false);
  });
});

describe("moduleSchema", () => {
  it("accepts a minimal module with no content arrays yet (freshly created, empty)", () => {
    expect(moduleSchema.safeParse({ type: "READING", order: 1, timeLimitMinutes: 60 }).success).toBe(true);
  });

  it("rejects a non-positive timeLimitMinutes", () => {
    expect(moduleSchema.safeParse({ type: "READING", order: 1, timeLimitMinutes: 0 }).success).toBe(false);
  });

  it("rejects an invalid module type", () => {
    expect(moduleSchema.safeParse({ type: "GRAMMAR", order: 1, timeLimitMinutes: 60 }).success).toBe(false);
  });
});

describe("createTestSchema / updateTestSchema", () => {
  it("accepts a minimal valid test and defaults isPublished to false", () => {
    const result = createTestSchema.parse({ title: "Cambridge 18 - Test 1", type: "ACADEMIC" });
    expect(result.isPublished).toBe(false);
  });

  it("rejects an empty title", () => {
    expect(createTestSchema.safeParse({ title: "", type: "ACADEMIC" }).success).toBe(false);
  });

  it("rejects an invalid test type", () => {
    expect(createTestSchema.safeParse({ title: "Test 1", type: "IELTS_PLUS" }).success).toBe(false);
  });

  it("updateTestSchema makes every field optional (partial update)", () => {
    expect(updateTestSchema.safeParse({}).success).toBe(true);
    expect(updateTestSchema.safeParse({ isPublished: true }).success).toBe(true);
  });

  it("updateTestSchema still rejects an invalid value for a field that IS provided", () => {
    expect(updateTestSchema.safeParse({ type: "NOT_A_TYPE" }).success).toBe(false);
  });
});
