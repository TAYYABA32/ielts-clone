"use client";

import { useEffect, useRef } from "react";
import { useTestStore } from "@/lib/store/testStore";
import { formatTime } from "@/lib/utils/formatTime";
import { TimerAnnouncement } from "./TimerAnnouncement";

interface CountdownTimerProps {
  onExpire: () => void;
  /** Show a visual warning state once remaining time drops to/below this many seconds. */
  warnAtSeconds?: number;
}

/**
 * Strict countdown that ticks server-independent wall-clock seconds and
 * fires onExpire exactly once when it hits zero, regardless of React
 * re-renders or tab throttling — it re-derives elapsed time from
 * performance.now() deltas rather than trusting setInterval's cadence.
 */
export function CountdownTimer({ onExpire, warnAtSeconds = 300 }: CountdownTimerProps) {
  const remainingSeconds = useTestStore((s) => s.remainingSeconds);
  const tickTimer = useTestStore((s) => s.tickTimer);
  const isSubmitted = useTestStore((s) => s.isSubmitted);
  const hasExpiredRef = useRef(false);
  const lastTickRef = useRef<number>(performance.now());

  useEffect(() => {
    if (isSubmitted) return;

    const intervalId = window.setInterval(() => {
      const now = performance.now();
      const elapsedMs = now - lastTickRef.current;
      // Catch up on any drift (backgrounded tab, slow frame) instead of
      // silently under-counting elapsed time.
      const wholeSecondsElapsed = Math.floor(elapsedMs / 1000);
      if (wholeSecondsElapsed >= 1) {
        lastTickRef.current += wholeSecondsElapsed * 1000;
        for (let i = 0; i < wholeSecondsElapsed; i += 1) {
          tickTimer();
        }
      }
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [isSubmitted, tickTimer]);

  useEffect(() => {
    if (remainingSeconds <= 0 && !hasExpiredRef.current && !isSubmitted) {
      hasExpiredRef.current = true;
      onExpire();
    }
  }, [remainingSeconds, isSubmitted, onExpire]);

  const isWarning = remainingSeconds <= warnAtSeconds;

  return (
    <div
      role="timer"
      className={`ielts-timer ${isWarning ? "ielts-timer--warning" : ""}`}
      data-testid="countdown-timer"
    >
      <span className="ielts-timer__label">Time Remaining</span>
      {/* Deliberately not aria-live — a per-second announcement is unusable
          for screen reader users. Still readable on demand (not
          aria-hidden) if a user navigates directly to it; TimerAnnouncement
          below handles proactive milestone announcements (5 min/1 min/etc.)
          instead of announcing every tick. */}
      <span className="ielts-timer__value">{formatTime(remainingSeconds)}</span>
      <TimerAnnouncement remainingSeconds={remainingSeconds} />
    </div>
  );
}
