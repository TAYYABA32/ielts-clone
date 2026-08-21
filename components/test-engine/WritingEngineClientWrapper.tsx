"use client";

import { useState } from "react";
import { WritingEngine, type WritingSubmitResult } from "./WritingEngine";
import { ModuleCompleteScreen } from "./ModuleCompleteScreen";
import type { TestType, WritingTask } from "@/types/test";
import type { NextModuleInfo } from "@/lib/testSequence";

interface WritingEngineClientWrapperProps {
  attemptId: string;
  moduleId: string;
  testType: TestType;
  tasks: WritingTask[];
  initialResponses?: Record<string, string>;
  remainingSecondsAtLoad: number;
  nextModule?: NextModuleInfo | null;
}

export function WritingEngineClientWrapper({ nextModule, ...props }: WritingEngineClientWrapperProps) {
  const [result, setResult] = useState<WritingSubmitResult | null>(null);

  if (result) {
    return (
      <ModuleCompleteScreen attemptId={props.attemptId} title="Writing module submitted" nextModule={nextModule}>
        {Object.entries(result.taskWordCounts).map(([taskId, count]) => (
          <span key={taskId} style={{ display: "block" }}>
            Task word count: {count}
          </span>
        ))}
        <p>Your essays will be scored by an examiner; the band score will appear on your attempt breakdown once graded.</p>
      </ModuleCompleteScreen>
    );
  }

  return <WritingEngine {...props} onSubmitted={setResult} />;
}
