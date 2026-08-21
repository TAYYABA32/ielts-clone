import type { UserAnswerMap } from "@/types/test";
import type { QuestionResult } from "@/lib/scoring/gradeModule";

export interface SubmitAttemptPayload {
  moduleId: string;
  answers: UserAnswerMap;
  flagged: Record<string, boolean>;
  timeSpentPerQuestion: Record<string, number>;
  totalTimeSpentSeconds: number;
}

export interface SubmitAttemptResponse {
  moduleAttemptId: string;
  rawScore: number;
  maxRawScore: number;
  bandScore: number;
  questionResults: QuestionResult[];
}

export async function submitAttempt(attemptId: string, payload: SubmitAttemptPayload): Promise<SubmitAttemptResponse> {
  const response = await fetch(`/api/test-attempts/${attemptId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Submission failed with status ${response.status}`);
  }

  return response.json();
}
