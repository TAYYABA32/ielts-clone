import { useEffect, useRef, useState } from "react";

/**
 * Drift-corrected countdown: re-derives elapsed time from performance.now()
 * deltas each tick instead of trusting setInterval's cadence, so a
 * backgrounded/throttled tab still counts down accurately. Fires onExpire
 * exactly once. Used by any timed candidate-facing screen that doesn't run
 * through the Reading/Listening Zustand store (Writing, Speaking prep/record).
 */
export function useCountdown(initialSeconds: number, onExpire: () => void, isPaused = false): number {
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const hasExpiredRef = useRef(false);
  const lastTickRef = useRef(performance.now());
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (isPaused) return undefined;
    lastTickRef.current = performance.now();

    const intervalId = window.setInterval(() => {
      const now = performance.now();
      const elapsedMs = now - lastTickRef.current;
      const wholeSecondsElapsed = Math.floor(elapsedMs / 1000);
      if (wholeSecondsElapsed >= 1) {
        lastTickRef.current += wholeSecondsElapsed * 1000;
        setRemainingSeconds((s) => Math.max(0, s - wholeSecondsElapsed));
      }
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [isPaused]);

  useEffect(() => {
    if (remainingSeconds <= 0 && !hasExpiredRef.current) {
      hasExpiredRef.current = true;
      onExpireRef.current();
    }
  }, [remainingSeconds]);

  return remainingSeconds;
}
