"use client";

import { useState } from "react";
import { SpeakingPartRunner } from "./SpeakingPartRunner";
import type { SpeakingPart, TestType } from "@/types/test";

interface SpeakingEngineProps {
  attemptId: string;
  moduleId: string;
  testType: TestType;
  parts: SpeakingPart[];
  onAllPartsComplete: () => void;
}

export function SpeakingEngine({ attemptId, moduleId, testType, parts, onAllPartsComplete }: SpeakingEngineProps) {
  const sortedParts = [...parts].sort((a, b) => a.partNumber - b.partNumber);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentPart = sortedParts[currentIndex];

  const handlePartComplete = () => {
    if (currentIndex + 1 < sortedParts.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      onAllPartsComplete();
    }
  };

  if (!currentPart) return null;

  return (
    <div className="ielts-test-engine" data-testid="speaking-engine">
      <header className="ielts-test-engine__header">
        <span className="ielts-test-engine__title">
          IELTS {testType === "ACADEMIC" ? "Academic" : "General Training"} — Speaking Module
        </span>
        <span className="ielts-test-engine__progress">
          Part {currentPart.partNumber} of {sortedParts.length}
        </span>
      </header>

      <SpeakingPartRunner
        key={currentPart.id}
        part={currentPart}
        attemptId={attemptId}
        moduleId={moduleId}
        isLastPart={currentIndex === sortedParts.length - 1}
        onComplete={handlePartComplete}
      />
    </div>
  );
}
