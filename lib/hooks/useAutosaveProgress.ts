import { useEffect, useRef } from "react";
import { useTestStore } from "@/lib/store/testStore";

const AUTOSAVE_INTERVAL_MS = 15_000;

async function pushProgress(attemptId: string, keepalive: boolean) {
  const state = useTestStore.getState();
  if (state.isSubmitted) return;

  try {
    await fetch(`/api/test-attempts/${attemptId}/progress`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      keepalive,
      body: JSON.stringify({
        responsesJson: state.answers,
        flaggedJson: state.flagged,
        remainingSeconds: state.remainingSeconds,
      }),
    });
  } catch {
    // Best-effort: a missed autosave tick isn't fatal since the next tick
    // (or the final submission) will carry the latest state anyway.
  }
}

/** Periodically persists in-progress answers/flags/remaining time so a closed tab can resume later, plus a best-effort flush on unload. */
export function useAutosaveProgress(attemptId: string) {
  const isSubmitted = useTestStore((s) => s.isSubmitted);
  const attemptIdRef = useRef(attemptId);
  attemptIdRef.current = attemptId;

  useEffect(() => {
    if (isSubmitted) return;

    const intervalId = window.setInterval(() => {
      void pushProgress(attemptIdRef.current, false);
    }, AUTOSAVE_INTERVAL_MS);

    const handleBeforeUnload = () => {
      void pushProgress(attemptIdRef.current, true);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") handleBeforeUnload();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isSubmitted]);
}
