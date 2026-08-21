"use client";

import { useState } from "react";
import type { ModuleType } from "@/types/test";

export interface QuestionRow {
  questionId: string;
  order: number;
  context: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean | null;
  timeSpentSeconds: number;
  flagged: boolean;
}

export interface ModuleBreakdown {
  moduleAttemptId: string;
  moduleType: ModuleType;
  rawScore: number | null;
  maxRawScore: number | null;
  bandScore: number | null;
  timeSpentSeconds: number;
  questionRows: QuestionRow[];
}

interface AttemptBreakdownProps {
  testTitle: string;
  overallBand: number | null;
  submittedAt: string | null;
  modules: ModuleBreakdown[];
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function ModuleSection({ module }: { module: ModuleBreakdown }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isObjectivelyGraded = module.moduleType === "LISTENING" || module.moduleType === "READING";

  return (
    <section className="ielts-breakdown-module">
      <button type="button" className="ielts-breakdown-module__header" onClick={() => setIsExpanded((v) => !v)}>
        <span>{module.moduleType}</span>
        <span className="ielts-breakdown-module__band">
          {module.bandScore !== null ? `Band ${module.bandScore.toFixed(1)}` : "Pending examiner review"}
        </span>
        {isObjectivelyGraded && module.rawScore !== null && (
          <span className="ielts-breakdown-module__raw">
            {module.rawScore}/{module.maxRawScore} correct
          </span>
        )}
        <span className="ielts-breakdown-module__time">{formatDuration(module.timeSpentSeconds)}</span>
        <span aria-hidden="true">{isExpanded ? "▾" : "▸"}</span>
      </button>

      {isExpanded && isObjectivelyGraded && (
        <table className="ielts-breakdown-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Question</th>
              <th>Your Answer</th>
              <th>Correct Answer</th>
              <th>Result</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {module.questionRows.map((row) => (
              <tr key={row.questionId} className={row.isCorrect ? "ielts-breakdown-row--correct" : "ielts-breakdown-row--incorrect"}>
                <td>{row.order}</td>
                <td>{row.context}</td>
                <td>{row.userAnswer}</td>
                <td>{row.correctAnswer}</td>
                <td>{row.isCorrect ? "✓ Correct" : "✗ Incorrect"}</td>
                <td>{formatDuration(row.timeSpentSeconds)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {isExpanded && !isObjectivelyGraded && (
        <p className="ielts-breakdown-module__pending-note">
          {module.moduleType === "WRITING" ? "Writing" : "Speaking"} responses are scored by an examiner rather than
          auto-graded; the band score above reflects the examiner&apos;s assessment once submitted for review.
        </p>
      )}
    </section>
  );
}

export function AttemptBreakdown({ testTitle, overallBand, submittedAt, modules }: AttemptBreakdownProps) {
  return (
    <div className="ielts-attempt-breakdown" data-testid="attempt-breakdown">
      <header className="ielts-attempt-breakdown__header">
        <h1>{testTitle}</h1>
        {submittedAt && <p>Submitted {new Date(submittedAt).toLocaleString()}</p>}
        <p className="ielts-attempt-breakdown__overall-band">
          Overall Band: {overallBand !== null ? overallBand.toFixed(1) : "Pending"}
        </p>
      </header>

      {modules.map((module) => (
        <ModuleSection key={module.moduleAttemptId} module={module} />
      ))}
    </div>
  );
}
