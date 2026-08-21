"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTestStore } from "@/lib/store/testStore";
import { submitAttempt, type SubmitAttemptResponse } from "@/lib/api/submitAttempt";
import { useAutosaveProgress } from "@/lib/hooks/useAutosaveProgress";
import { ResizableSplitScreen } from "./ResizableSplitScreen";
import { CountdownTimer } from "./CountdownTimer";
import { RestrictedAudioPlayer } from "./RestrictedAudioPlayer";
import { QuestionRenderer } from "./QuestionRenderer";
import { QuestionNavigator } from "./QuestionNavigator";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { ClientGradableModule, ModuleType, TestType, UserAnswerMap } from "@/types/test";

interface TestEngineProps {
  moduleType: Extract<ModuleType, "READING" | "LISTENING">;
  module: ClientGradableModule;
  testType: TestType;
  attemptId: string;
  moduleId: string;
  initialAnswers?: UserAnswerMap;
  initialFlagged?: Record<string, boolean>;
  /** Seconds left when this component mounts — supports resuming a saved attempt mid-module. */
  remainingSecondsAtLoad?: number;
  onSubmitted: (result: SubmitAttemptResponse) => void;
}

// Memoized: TestEngine re-renders on every answer/flag/timer-tick change
// elsewhere in the store (see handleSubmit below), but these panes' only
// prop — `module` — is set once at mount and never changes. Without memo,
// every keystroke in any question would re-render the entire passage/audio/
// question-sheet tree, not just the one question that changed.
const ReadingPassagePane = memo(function ReadingPassagePane({ module }: { module: ClientGradableModule }) {
  if (!("passages" in module)) return null;
  return (
    <div className="ielts-passage-pane" data-testid="passage-pane">
      {module.passages.map((passage) => (
        <article key={passage.id} className="ielts-passage">
          <h2>{passage.title}</h2>
          <div className="ielts-passage__body">
            {passage.bodyText.split("\n").map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
});

const ListeningAudioPane = memo(function ListeningAudioPane({ module }: { module: ClientGradableModule }) {
  const [trackIndex, setTrackIndex] = useState(0);

  if (!("audioTracks" in module)) return null;
  const tracks = [...module.audioTracks].sort((a, b) => a.order - b.order);
  const currentTrack = tracks[trackIndex];

  return (
    <div className="ielts-audio-pane" data-testid="audio-pane">
      <h2>{currentTrack ? `Section ${trackIndex + 1}: ${currentTrack.title}` : "Listening"}</h2>
      {currentTrack && (
        <RestrictedAudioPlayer
          key={currentTrack.id}
          audioUrl={currentTrack.audioUrl}
          autoPlay
          onEnded={() => {
            if (trackIndex < tracks.length - 1) setTrackIndex((i) => i + 1);
          }}
        />
      )}
      <p className="ielts-audio-pane__hint">
        Audio plays once, automatically, with no rewind — exactly as in the real test.
      </p>
    </div>
  );
});

const QuestionSheetPane = memo(function QuestionSheetPane({ module }: { module: ClientGradableModule }) {
  const groups = [...module.questionGroups].sort((a, b) => a.order - b.order);
  return (
    <div className="ielts-question-sheet" data-testid="question-sheet-pane">
      {groups.map((group) => (
        <section key={group.id} className="ielts-question-group">
          <p className="ielts-question-group__instructions">{group.instructions}</p>
          {group.groupData?.mapImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- external, per-test asset URL (admin-uploaded, arbitrary aspect ratio — see PERFORMANCE_REPORT.md for why this stays <img>, not next/image)
            <img src={group.groupData.mapImageUrl} alt="Map for labeling questions" className="ielts-question-group__map-image" />
          )}
          {[...group.questions]
            .sort((a, b) => a.order - b.order)
            .map((question) => (
              <QuestionRenderer key={question.id} question={question} group={group} />
            ))}
        </section>
      ))}
    </div>
  );
});

export function TestEngine({
  moduleType,
  module,
  testType,
  attemptId,
  moduleId,
  initialAnswers,
  initialFlagged,
  remainingSecondsAtLoad,
  onSubmitted,
}: TestEngineProps) {
  const initModule = useTestStore((s) => s.initModule);
  const markSubmitted = useTestStore((s) => s.markSubmitted);

  useAutosaveProgress(attemptId);

  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const totalSeconds = module.timeLimitMinutes * 60;

  useEffect(() => {
    initModule({
      moduleType,
      module,
      attemptId,
      moduleId,
      initialAnswers,
      initialFlagged,
      remainingSeconds: remainingSecondsAtLoad ?? totalSeconds,
    });
    // Intentionally runs once per module mount — re-running on every store
    // update would blow away in-progress answers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

  const handleSubmit = useCallback(async () => {
    // Read the store directly at call-time rather than subscribing to
    // answers/flagged/timeSpentPerQuestion/remainingSeconds reactively at the
    // component's top level: those values are only ever needed here, inside
    // this closure, never in TestEngine's own JSX — subscribing to them there
    // was re-rendering the entire question sheet (every question, on every
    // question) on every keystroke anywhere in the module and every second
    // from the countdown timer. A point-in-time getState() read is exactly
    // as correct for "the values at the moment of submission" and doesn't
    // force TestEngine to re-render on every store change. See
    // PERFORMANCE_REPORT.md for the full before/after reasoning.
    const { isSubmitted, answers, flagged, timeSpentPerQuestion, remainingSeconds } = useTestStore.getState();
    if (isSubmitted || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitAttempt(attemptId, {
        moduleId,
        answers,
        flagged,
        timeSpentPerQuestion,
        totalTimeSpentSeconds: totalSeconds - remainingSeconds,
      });
      markSubmitted();
      onSubmitted(result);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  }, [isSubmitting, attemptId, moduleId, totalSeconds, markSubmitted, onSubmitted]);

  const leftPane = useMemo(
    () => (moduleType === "READING" ? <ReadingPassagePane module={module} /> : <ListeningAudioPane module={module} />),
    [moduleType, module]
  );

  return (
    <div className="ielts-test-engine" data-testid="test-engine">
      <header className="ielts-test-engine__header">
        <span className="ielts-test-engine__title">
          IELTS {testType === "ACADEMIC" ? "Academic" : "General Training"} — {moduleType === "READING" ? "Reading" : "Listening"} Module
        </span>
        <CountdownTimer onExpire={handleSubmit} />
      </header>

      <ResizableSplitScreen left={leftPane} right={<QuestionSheetPane module={module} />} />

      <QuestionNavigator onSubmitClick={() => setShowConfirm(true)} />

      <ConfirmDialog
        open={showConfirm}
        title={`Submit ${moduleType === "READING" ? "Reading" : "Listening"} module?`}
        description={submitError ?? "Submit the test now? You won't be able to change any answers afterward."}
        confirmLabel="Submit"
        cancelLabel="Keep Working"
        isConfirming={isSubmitting}
        onConfirm={handleSubmit}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
