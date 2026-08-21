import type { Question as PrismaQuestion } from "@prisma/client";

/** Best-effort human-readable context line for a question row in the breakdown table, read straight off the flexible `data` JSON column. */
export function describeQuestionContext(question: Pick<PrismaQuestion, "prompt" | "data">): string {
  if (question.prompt) return question.prompt;

  const data = (question.data ?? {}) as Record<string, unknown>;
  if (typeof data.statement === "string") return data.statement;
  if (typeof data.textWithBlank === "string") return data.textWithBlank;
  if (typeof data.paragraphLabel === "string") return data.paragraphLabel;
  if (typeof data.labelPointId === "string") return `Map point ${data.labelPointId}`;
  return "—";
}

function formatAnswerValue(value: unknown): string {
  if (value === null || value === undefined) return "(no answer)";
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "(no answer)";
  return String(value);
}

export { formatAnswerValue };
