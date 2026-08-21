"use client";

import { useState } from "react";
import { SpeakingEngine } from "./SpeakingEngine";
import { ModuleCompleteScreen } from "./ModuleCompleteScreen";
import type { SpeakingPart, TestType } from "@/types/test";
import type { NextModuleInfo } from "@/lib/testSequence";

interface SpeakingEngineClientWrapperProps {
  attemptId: string;
  moduleId: string;
  testType: TestType;
  parts: SpeakingPart[];
  nextModule?: NextModuleInfo | null;
}

export function SpeakingEngineClientWrapper({ nextModule, ...props }: SpeakingEngineClientWrapperProps) {
  const [isComplete, setIsComplete] = useState(false);

  if (isComplete) {
    return (
      <ModuleCompleteScreen attemptId={props.attemptId} title="Speaking module complete" nextModule={nextModule}>
        <p>All three parts have been recorded and uploaded. An examiner will score your responses.</p>
      </ModuleCompleteScreen>
    );
  }

  return <SpeakingEngine {...props} onAllPartsComplete={() => setIsComplete(true)} />;
}
