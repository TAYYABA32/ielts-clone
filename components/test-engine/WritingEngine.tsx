"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ResizableSplitScreen } from "./ResizableSplitScreen";
import { TimerAnnouncement } from "./TimerAnnouncement";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatTime } from "@/lib/utils/formatTime";
import { countWords } from "@/lib/utils/wordCount";
import { useCountdown } from "@/lib/hooks/useCountdown";
import type { TestType, WritingTask } from "@/types/test";

export interface WritingSubmitResult {
  moduleAttemptId: string;
  taskWordCounts: Record<string, number>;
}

interface WritingEngineProps {
  attemptId: string;
  moduleId: string;
  testType: TestType;
  tasks: WritingTask[];
  initialResponses?: Record<string, string>;
  remainingSecondsAtLoad: number;
  onSubmitted: (result: WritingSubmitResult) => void;
}

const AUTOSAVE_INTERVAL_MS = 15_000;

function TaskPrompt({ task }: { task: WritingTask }) {
  return (
    <div className="ielts-writing-prompt" data-testid="writing-prompt">
      <h2>Task {task.taskNumber}</h2>
      {task.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- external, per-test asset URL
        <img src={task.imageUrl} alt={`Task ${task.taskNumber} chart/diagram`} className="ielts-writing-prompt__image" />
      )}
      <p>{task.prompt}</p>
      <p className="ielts-writing-prompt__requirement">
        Write at least {task.minWords} words. Recommended time: {task.timeLimitMinutes} minutes.
      </p>
    </div>
  );
}

export function WritingEngine({
  attemptId,
  moduleId,
  testType,
  tasks,
  initialResponses,
  remainingSecondsAtLoad,
  onSubmitted,
}: WritingEngineProps) {
  const sortedTasks = [...tasks].sort((a, b) => a.taskNumber - b.taskNumber);
  const [activeTaskId, setActiveTaskId] = useState(sortedTasks[0]?.id ?? "");
  const [responses, setResponses] = useState<Record<string, string>>(initialResponses ?? {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const responsesRef = useRef(responses);
  responsesRef.current = responses;

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || isSubmitted) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch(`/api/test-attempts/${attemptId}/writing-submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, responses: responsesRef.current }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Submission failed");
      }
      const result: WritingSubmitResult = await response.json();
      setIsSubmitted(true);
      onSubmitted(result);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  }, [attemptId, moduleId, isSubmitting, isSubmitted, onSubmitted]);

  const remainingSeconds = useCountdown(remainingSecondsAtLoad, handleSubmit, isSubmitted);

  // Autosave: periodic + best-effort flush on unload, mirroring the
  // Reading/Listening autosave hook but reading local state directly since
  // Writing doesn't run through the Zustand test store.
  useEffect(() => {
    if (isSubmitted) return undefined;

    const push = (keepalive: boolean) => {
      void fetch(`/api/test-attempts/${attemptId}/progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        keepalive,
        body: JSON.stringify({ responsesJson: responsesRef.current, flaggedJson: {}, remainingSeconds }),
      }).catch(() => {
        // Best-effort: the next tick or final submission carries the latest state anyway.
      });
    };

    const intervalId = window.setInterval(() => push(false), AUTOSAVE_INTERVAL_MS);
    const handleBeforeUnload = () => push(true);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
    // remainingSeconds intentionally omitted: this effect only needs to
    // (re)start the interval when submission state changes, not every tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, isSubmitted]);

  const activeTask = sortedTasks.find((t) => t.id === activeTaskId);
  const activeText = activeTask ? (responses[activeTask.id] ?? "") : "";
  const activeWordCount = countWords(activeText);
  const meetsMinWords = activeTask ? activeWordCount >= activeTask.minWords : false;

  return (
    <div className="ielts-test-engine" data-testid="writing-engine">
      <header className="ielts-test-engine__header">
        <span className="ielts-test-engine__title">
          IELTS {testType === "ACADEMIC" ? "Academic" : "General Training"} — Writing Module
        </span>
        <div role="timer" className={`ielts-timer ${remainingSeconds <= 300 ? "ielts-timer--warning" : ""}`}>
          <span className="ielts-timer__label">Time Remaining</span>
          {/* See CountdownTimer.tsx / ACCESSIBILITY_REPORT.md — deliberately
              not aria-live; a per-second announcement is unusable. */}
          <span className="ielts-timer__value">{formatTime(remainingSeconds)}</span>
          <TimerAnnouncement remainingSeconds={remainingSeconds} />
        </div>
      </header>

      <nav className="ielts-writing-tabs" aria-label="Writing tasks">
        {sortedTasks.map((task) => {
          const wordCount = countWords(responses[task.id] ?? "");
          const isActive = task.id === activeTaskId;
          return (
            <button
              key={task.id}
              type="button"
              aria-current={isActive ? "true" : undefined}
              className={isActive ? "ielts-writing-tabs__tab--active" : ""}
              onClick={() => setActiveTaskId(task.id)}
            >
              Task {task.taskNumber} ({wordCount} words)
            </button>
          );
        })}
      </nav>

      {activeTask && (
        <ResizableSplitScreen
          left={<TaskPrompt task={activeTask} />}
          right={
            <div className="ielts-writing-response" data-testid="writing-response-area">
              <textarea
                value={activeText}
                onChange={(e) => setResponses((prev) => ({ ...prev, [activeTask.id]: e.target.value }))}
                placeholder={`Write your response to Task ${activeTask.taskNumber} here…`}
                aria-label={`Task ${activeTask.taskNumber} response`}
              />
              <div className="ielts-writing-response__counts">
                <span className={meetsMinWords ? "ielts-writing-response__count--ok" : "ielts-writing-response__count--under"}>
                  {activeWordCount} words (min {activeTask.minWords})
                </span>
                <span>{activeText.length} characters</span>
              </div>
            </div>
          }
          storageKey="ielts-writing-split-ratio"
        />
      )}

      <div className="ielts-test-engine__footer">
        <button type="button" onClick={() => setShowConfirm(true)} disabled={isSubmitting || isSubmitted}>
          Submit Writing Module
        </button>
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Submit Writing module?"
        description={
          submitError ??
          "Submit both writing tasks now? You won't be able to make further changes afterward."
        }
        confirmLabel="Submit"
        cancelLabel="Keep Writing"
        isConfirming={isSubmitting}
        onConfirm={handleSubmit}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
