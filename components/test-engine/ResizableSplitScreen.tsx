"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

interface ResizableSplitScreenProps {
  left: ReactNode;
  right: ReactNode;
  /** Initial split as a percentage (0-100) given to the left pane. */
  initialLeftPct?: number;
  minLeftPct?: number;
  maxLeftPct?: number;
  storageKey?: string;
}

/**
 * Left pane: passage text or audio player. Right pane: question sheet.
 * Drag the divider to resize; the split ratio persists to localStorage per
 * storageKey so it's remembered across module transitions in the same test.
 */
export function ResizableSplitScreen({
  left,
  right,
  initialLeftPct = 50,
  minLeftPct = 25,
  maxLeftPct = 75,
  storageKey = "ielts-split-ratio",
}: ResizableSplitScreenProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [leftPct, setLeftPct] = useState(initialLeftPct);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed) && parsed >= minLeftPct && parsed <= maxLeftPct) {
        setLeftPct(parsed);
      }
    }
  }, [storageKey, minLeftPct, maxLeftPct]);

  const clamp = useCallback((pct: number) => Math.min(maxLeftPct, Math.max(minLeftPct, pct)), [minLeftPct, maxLeftPct]);

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const rawPct = ((clientX - rect.left) / rect.width) * 100;
      const nextPct = clamp(rawPct);
      setLeftPct(nextPct);
    },
    [clamp]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => updateFromClientX(e.clientX);
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) updateFromClientX(touch.clientX);
    };
    const handleUp = () => {
      setIsDragging(false);
      window.localStorage.setItem(storageKey, String(leftPct));
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchend", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchend", handleUp);
    };
  }, [isDragging, updateFromClientX, storageKey, leftPct]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const step = 2;
      if (e.key === "ArrowLeft") setLeftPct((p) => clamp(p - step));
      if (e.key === "ArrowRight") setLeftPct((p) => clamp(p + step));
    },
    [clamp]
  );

  return (
    <div ref={containerRef} className="ielts-split-screen" data-testid="resizable-split-screen">
      <div className="ielts-split-screen__pane ielts-split-screen__pane--left" style={{ width: `${leftPct}%` }}>
        {left}
      </div>

      <div
        role="separator"
        aria-label="Resize passage/question panes"
        aria-orientation="vertical"
        aria-valuenow={Math.round(leftPct)}
        aria-valuemin={minLeftPct}
        aria-valuemax={maxLeftPct}
        tabIndex={0}
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
        onKeyDown={handleKeyDown}
        className={`ielts-split-screen__divider ${isDragging ? "ielts-split-screen__divider--active" : ""}`}
        data-testid="split-screen-divider"
      />

      <div className="ielts-split-screen__pane ielts-split-screen__pane--right" style={{ width: `${100 - leftPct}%` }}>
        {right}
      </div>
    </div>
  );
}
