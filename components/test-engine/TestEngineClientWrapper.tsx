"use client";

import { useState } from "react";
import { TestEngine } from "./TestEngine";
import { ModuleCompleteScreen } from "./ModuleCompleteScreen";
import type { SubmitAttemptResponse } from "@/lib/api/submitAttempt";
import type { ClientGradableModule, ModuleType, TestType, UserAnswerMap } from "@/types/test";
import type { NextModuleInfo } from "@/lib/testSequence";

interface TestEngineClientWrapperProps {
  moduleType: Extract<ModuleType, "READING" | "LISTENING">;
  module: ClientGradableModule;
  testType: TestType;
  attemptId: string;
  moduleId: string;
  initialAnswers?: UserAnswerMap;
  initialFlagged?: Record<string, boolean>;
  remainingSecondsAtLoad?: number;
  nextModule?: NextModuleInfo | null;
}

/** Server pages can't hand a client component a function prop, so this thin client wrapper owns the onSubmitted callback and the post-submit summary view. */
export function TestEngineClientWrapper({ nextModule, ...props }: TestEngineClientWrapperProps) {
  const [result, setResult] = useState<SubmitAttemptResponse | null>(null);

  if (result) {
    return (
      <ModuleCompleteScreen attemptId={props.attemptId} title={`${props.moduleType} module submitted`} nextModule={nextModule}>
        <p>
          Raw score: {result.rawScore}/{result.maxRawScore}
        </p>
        <p>Band score: {result.bandScore.toFixed(1)}</p>
      </ModuleCompleteScreen>
    );
  }

  return <TestEngine {...props} onSubmitted={setResult} />;
}
