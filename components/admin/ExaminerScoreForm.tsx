"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const FULL_BAND_OPTIONS = ["", ...Array.from({ length: 19 }, (_, i) => (i * 0.5).toFixed(1))]; // "", 0.0 .. 9.0

interface ExaminerScoreFormProps {
  attemptId: string;
  moduleAttemptId: string;
  moduleLabel: string;
  initialBandScore: number | null;
  initialExaminerNotes: string | null;
}

/** Band-score + notes control for one Writing or Speaking module attempt. Saves via the existing admin PATCH route, then refreshes the server-rendered page so the overall band (recomputed server-side) reflects the change. */
export function ExaminerScoreForm({
  attemptId,
  moduleAttemptId,
  moduleLabel,
  initialBandScore,
  initialExaminerNotes,
}: ExaminerScoreFormProps) {
  const router = useRouter();
  const [bandScore, setBandScore] = useState(initialBandScore !== null ? initialBandScore.toFixed(1) : "");
  const [examinerNotes, setExaminerNotes] = useState(initialExaminerNotes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (bandScore === "") {
      setError("Select a band score before saving");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/attempts/${attemptId}/module-attempts/${moduleAttemptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bandScore: Number(bandScore), examinerNotes: examinerNotes || undefined }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save score");
      }
      setSavedAt(Date.now());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save score");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="ielts-examiner-score-form" data-testid="examiner-score-form">
      <label>
        {moduleLabel} Band Score
        <select value={bandScore} onChange={(e) => setBandScore(e.target.value)} required>
          {FULL_BAND_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === "" ? "Select…" : option}
            </option>
          ))}
        </select>
      </label>

      <label>
        Examiner Notes
        <textarea
          value={examinerNotes}
          onChange={(e) => setExaminerNotes(e.target.value)}
          rows={4}
          placeholder="Optional feedback for the candidate/internal record"
        />
      </label>

      {error && (
        <p role="alert" className="ielts-examiner-score-form__error">
          {error}
        </p>
      )}

      <div className="ielts-examiner-score-form__actions">
        <button type="submit" disabled={isSaving}>
          {isSaving ? "Saving…" : "Save Score"}
        </button>
        {savedAt && <span className="ielts-examiner-score-form__saved">Saved ✓</span>}
      </div>
    </form>
  );
}
