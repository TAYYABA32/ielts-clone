"use client";

import { useEffect, useRef, useState } from "react";
import { formatTime } from "@/lib/utils/formatTime";

// Announce only at meaningful milestones — a per-second aria-live update
// (the previous pattern on both CountdownTimer and WritingEngine's inline
// timer) is unusable for screen reader users: most screen readers either
// spam an announcement every second or silently drop updates that arrive
// faster than they can be spoken. See ACCESSIBILITY_REPORT.md.
const ANNOUNCE_THRESHOLDS_SECONDS = [300, 60, 30, 10, 0];

interface TimerAnnouncementProps {
  remainingSeconds: number;
}

/**
 * Visually-hidden live region announcing only "5 minutes remaining" / "1
 * minute remaining" / etc. — pair with a plain (non-live) visible countdown
 * that updates every second for sighted users. Uses a crossed-threshold
 * comparison (previous value vs. current), not exact-value matching, so it
 * can't miss an announcement if a render skips over a threshold.
 */
export function TimerAnnouncement({ remainingSeconds }: TimerAnnouncementProps) {
  const [message, setMessage] = useState("");
  const previousRef = useRef(remainingSeconds);
  const announcedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const previous = previousRef.current;
    previousRef.current = remainingSeconds;

    const crossed = ANNOUNCE_THRESHOLDS_SECONDS.find(
      (threshold) => previous > threshold && remainingSeconds <= threshold && !announcedRef.current.has(threshold)
    );
    if (crossed !== undefined) {
      announcedRef.current.add(crossed);
      setMessage(crossed === 0 ? "Time is up." : `${formatTime(crossed)} remaining.`);
    }
  }, [remainingSeconds]);

  return (
    <span className="sr-only" role="status" aria-live="assertive" aria-atomic="true">
      {message}
    </span>
  );
}
