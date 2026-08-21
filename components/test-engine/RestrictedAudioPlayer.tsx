"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface RestrictedAudioPlayerProps {
  audioUrl: string;
  /** Called once the track has played through to the end. */
  onEnded?: () => void;
  /** Auto-starts playback on mount, matching the real test (audio starts once, unprompted). */
  autoPlay?: boolean;
}

/**
 * Mirrors real IELTS Listening test conditions:
 *  - plays exactly once, start to finish, no pause, no seeking backward or
 *    forward, no changeable playback rate, no volume-driven skip tricks;
 *  - the only affordance is a mute toggle (candidates can still use
 *    headphones/volume knobs, but the UI itself offers no scrub bar);
 *  - reports elapsed time as a read-only progress indicator only.
 */
export function RestrictedAudioPlayer({ audioUrl, onEnded, autoPlay = true }: RestrictedAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [status, setStatus] = useState<"idle" | "playing" | "ended" | "blocked">("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const maxAllowedTimeRef = useRef(0);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl || !autoPlay) return;
    audioEl.play().catch(() => setStatus("blocked"));
  }, [autoPlay]);

  const handleTimeUpdate = useCallback(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    // Enforce forward-only, one-shot playback: if currentTime ever jumps
    // ahead of the highest point we've legitimately reached (e.g. a user
    // drags the native scrubber via devtools, or a seek event fires), snap
    // back. This is a UX guard, not a security boundary — real proctoring
    // is server-side (see submission integrity notes in TestEngine).
    if (audioEl.currentTime > maxAllowedTimeRef.current + 0.5) {
      audioEl.currentTime = maxAllowedTimeRef.current;
    } else {
      maxAllowedTimeRef.current = audioEl.currentTime;
    }
    setCurrentTime(audioEl.currentTime);
  }, []);

  const handleSeeking = useCallback(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    if (audioEl.currentTime > maxAllowedTimeRef.current + 0.5) {
      audioEl.currentTime = maxAllowedTimeRef.current;
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    setDuration(audioEl.duration);
  }, []);

  const handleEnded = useCallback(() => {
    setStatus("ended");
    onEnded?.();
  }, [onEnded]);

  const handlePause = useCallback(() => {
    // The real test never lets a candidate pause; if playback stops for any
    // reason other than reaching the end, resume immediately.
    const audioEl = audioRef.current;
    if (!audioEl) return;
    if (status !== "ended" && audioEl.currentTime < audioEl.duration) {
      audioEl.play().catch(() => setStatus("blocked"));
    }
  }, [status]);

  const startPlayback = useCallback(() => {
    audioRef.current?.play().then(() => setStatus("playing")).catch(() => setStatus("blocked"));
  }, []);

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="ielts-audio-player" data-testid="restricted-audio-player">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- transcripts are provided separately post-test, not during, per real exam conditions */}
      <audio
        ref={audioRef}
        aria-label="Listening test audio"
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onSeeking={handleSeeking}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPause={handlePause}
        onPlay={() => setStatus("playing")}
        muted={isMuted}
        controlsList="nodownload noplaybackrate noremoteplayback"
        onContextMenu={(e) => e.preventDefault()}
        // Intentionally no `controls` attribute — no native scrub bar.
      />

      <div className="ielts-audio-player__bar" aria-hidden="true">
        <div className="ielts-audio-player__progress" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="ielts-audio-player__controls">
        {status === "blocked" && (
          <button type="button" onClick={startPlayback} className="ielts-audio-player__start-btn">
            ▶ Start Audio
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsMuted((m) => !m)}
          aria-pressed={isMuted}
          className="ielts-audio-player__mute-btn"
        >
          {isMuted ? "🔇 Unmute" : "🔊 Mute"}
        </button>
        <span className="ielts-audio-player__status" role="status">
          {status === "playing" && "Playing…"}
          {status === "ended" && "Audio finished"}
          {status === "idle" && "Loading…"}
          {status === "blocked" && "Click Start Audio to begin"}
        </span>
      </div>
    </div>
  );
}
