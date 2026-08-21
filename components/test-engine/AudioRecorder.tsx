"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatTime } from "@/lib/utils/formatTime";

type RecorderStatus = "requesting-permission" | "recording" | "stopped" | "error";

// Announced once per status change (recording starts automatically via
// autoStart, so a screen reader user not already focused here needs to be
// told it started) — never keyed by elapsedSeconds, which would repeat the
// same per-second-announcement problem the countdown timer had.
// "error" is intentionally blank: that state already gets its own
// role="alert" below, so this would double-announce it.
const STATUS_ANNOUNCEMENTS: Record<RecorderStatus, string> = {
  "requesting-permission": "Requesting microphone access.",
  recording: "Recording started.",
  stopped: "Recording complete.",
  error: "",
};

interface AudioRecorderProps {
  /** Recording auto-stops once this many seconds have elapsed (e.g. 120s for the Part 2 cue card answer). */
  maxDurationSeconds: number;
  onRecordingComplete: (blob: Blob, durationSeconds: number) => void;
  /** Starts capturing (after mic permission) as soon as the component mounts, matching how the real test moves straight from prep into recording. */
  autoStart?: boolean;
}

/** Thin wrapper around the browser MediaRecorder API: requests the mic once, records to a Blob, and auto-stops at maxDurationSeconds. */
export function AudioRecorder({ maxDurationSeconds, onRecordingComplete, autoStart = true }: AudioRecorderProps) {
  const [status, setStatus] = useState<RecorderStatus>("requesting-permission");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const intervalRef = useRef<number | null>(null);
  const hasCompletedRef = useRef(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const startRecording = useCallback(async () => {
    setStatus("requesting-permission");
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const durationSeconds = Math.round((performance.now() - startedAtRef.current) / 1000);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        stopStream();
        setStatus("stopped");
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          onRecordingComplete(blob, durationSeconds);
        }
      };

      recorder.start();
      startedAtRef.current = performance.now();
      setStatus("recording");
      setElapsedSeconds(0);

      intervalRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next >= maxDurationSeconds) {
            stopRecording();
          }
          return next;
        });
      }, 1000);
    } catch {
      setStatus("error");
      setErrorMessage("Microphone access is required to record your answer. Please allow microphone access and retry.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally captures maxDurationSeconds/onRecordingComplete once per mount
  }, []);

  useEffect(() => {
    if (autoStart) void startRecording();
    return () => {
      stopRecording();
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount only
  }, []);

  return (
    <div className="ielts-audio-recorder" data-testid="audio-recorder">
      <span className="sr-only" role="status" aria-live="polite">
        {STATUS_ANNOUNCEMENTS[status]}
      </span>

      {status === "requesting-permission" && <p>Requesting microphone access…</p>}

      {status === "error" && (
        <div className="ielts-audio-recorder__error">
          <p role="alert">{errorMessage}</p>
          <button type="button" onClick={() => void startRecording()}>
            Retry
          </button>
        </div>
      )}

      {status === "recording" && (
        <div className="ielts-audio-recorder__active">
          <span className="ielts-audio-recorder__indicator" aria-hidden="true">
            ●
          </span>
          <span>
            Recording: {formatTime(elapsedSeconds)} / {formatTime(maxDurationSeconds)}
          </span>
          <button type="button" onClick={stopRecording}>
            Stop Recording
          </button>
        </div>
      )}

      {status === "stopped" && <p>Recording complete.</p>}
    </div>
  );
}
