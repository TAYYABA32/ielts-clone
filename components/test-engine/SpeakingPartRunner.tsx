"use client";

import { useState } from "react";
import { AudioRecorder } from "./AudioRecorder";
import { useCountdown } from "@/lib/hooks/useCountdown";
import { formatTime } from "@/lib/utils/formatTime";
import type { SpeakingPart } from "@/types/test";

type Phase = "prep" | "recording" | "uploading" | "done" | "error";

const DEFAULT_PREP_SECONDS = 60;
const DEFAULT_RECORD_SECONDS: Record<SpeakingPart["partNumber"], number> = { 1: 300, 2: 120, 3: 300 };

interface SpeakingPartRunnerProps {
  part: SpeakingPart;
  attemptId: string;
  moduleId: string;
  isLastPart: boolean;
  onComplete: () => void;
}

export function SpeakingPartRunner({ part, attemptId, moduleId, isLastPart, onComplete }: SpeakingPartRunnerProps) {
  const prepSeconds = part.partNumber === 2 ? (part.prepTimeSeconds ?? DEFAULT_PREP_SECONDS) : 0;
  const recordSeconds = part.speakingTimeSeconds ?? DEFAULT_RECORD_SECONDS[part.partNumber];

  const [phase, setPhase] = useState<Phase>(prepSeconds > 0 ? "prep" : "recording");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const prepRemaining = useCountdown(prepSeconds, () => setPhase("recording"), phase !== "prep");

  const uploadRecording = async (blob: Blob, durationSeconds: number) => {
    setPhase("uploading");
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("audio", blob, `part-${part.partNumber}.webm`);
      formData.append("moduleId", moduleId);
      formData.append("speakingPartId", part.id);
      formData.append("durationSeconds", String(durationSeconds));

      const response = await fetch(`/api/test-attempts/${attemptId}/speaking-upload`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Upload failed");
      }
      setPhase("done");
    } catch (err) {
      setPhase("error");
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  return (
    <section className="ielts-speaking-part" data-testid={`speaking-part-${part.partNumber}`}>
      <h2>Part {part.partNumber}</h2>

      {part.partNumber === 2 && part.cueCardText && (
        <div className="ielts-speaking-part__cue-card">
          <h3>Cue Card</h3>
          <p>{part.cueCardText}</p>
        </div>
      )}

      <ul className="ielts-speaking-part__questions">
        {part.questions.map((question, i) => (
          <li key={i}>{question}</li>
        ))}
      </ul>

      {phase === "prep" && (
        <div className="ielts-speaking-part__prep">
          <p>Preparation time: {formatTime(prepRemaining)}</p>
          <p>Recording will start automatically when preparation time ends.</p>
        </div>
      )}

      {phase === "recording" && (
        <AudioRecorder maxDurationSeconds={recordSeconds} onRecordingComplete={uploadRecording} autoStart />
      )}

      {phase === "uploading" && <p>Uploading your recording…</p>}

      {phase === "error" && (
        <div className="ielts-speaking-part__error">
          <p role="alert">{uploadError}</p>
          <button type="button" onClick={() => setPhase("recording")}>
            Re-record and try again
          </button>
        </div>
      )}

      {phase === "done" && (
        <div className="ielts-speaking-part__done">
          <p>Recording uploaded ✓</p>
          <button type="button" onClick={onComplete}>
            {isLastPart ? "Finish Speaking Module" : "Continue to Next Part"}
          </button>
        </div>
      )}
    </section>
  );
}
