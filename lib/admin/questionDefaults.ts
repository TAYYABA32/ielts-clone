import type { QuestionGroupInput, QuestionInput, QuestionType } from "@/lib/validation/testSchemas";

export function createDefaultQuestion(type: QuestionType, order: number): QuestionInput {
  const base = { id: crypto.randomUUID(), order, points: 1, prompt: "" };

  switch (type) {
    case "MULTIPLE_CHOICE":
      return {
        ...base,
        type: "MULTIPLE_CHOICE",
        allowMultipleSelect: false,
        options: [
          { key: "A", text: "" },
          { key: "B", text: "" },
        ],
        correctAnswer: "A",
      };
    case "TRUE_FALSE_NOT_GIVEN":
      return { ...base, type: "TRUE_FALSE_NOT_GIVEN", statement: "", correctAnswer: "TRUE" };
    case "MATCHING_HEADINGS":
      return { ...base, type: "MATCHING_HEADINGS", paragraphLabel: "", correctAnswer: "" };
    case "SENTENCE_COMPLETION":
      return {
        ...base,
        type: "SENTENCE_COMPLETION",
        textWithBlank: "The answer is ___.",
        maxWords: 3,
        correctAnswer: "",
        caseSensitive: false,
      };
    case "MAP_LABELING":
      return { ...base, type: "MAP_LABELING", labelPointId: "", correctAnswer: "" };
  }
}

export function createDefaultQuestionGroup(type: QuestionType, order: number): QuestionGroupInput {
  return {
    id: crypto.randomUUID(),
    order,
    type,
    instructions: "",
    groupData:
      type === "MATCHING_HEADINGS"
        ? { headings: [{ key: "i", text: "" }] }
        : type === "MAP_LABELING"
          ? { mapImageUrl: undefined, mapPoints: [], options: [{ key: "A", text: "" }] }
          : undefined,
    questions: [createDefaultQuestion(type, 1)],
  };
}
