import Link from "next/link";
import type { ReactNode } from "react";
import type { NextModuleInfo } from "@/lib/testSequence";

interface ModuleCompleteScreenProps {
  attemptId: string;
  title: string;
  nextModule?: NextModuleInfo | null;
  children?: ReactNode;
}

/** Shared post-submission screen for every module engine: shows a result summary, then either "Continue to the next module" or, once the sequence is done, just the breakdown link. */
export function ModuleCompleteScreen({ attemptId, title, nextModule, children }: ModuleCompleteScreenProps) {
  return (
    <div className="ielts-module-complete" data-testid="module-complete">
      <h1>{title}</h1>
      {children}
      <div className="ielts-module-complete__actions">
        {nextModule && (
          <Link href={nextModule.href} className="ielts-module-complete__continue">
            Continue to {nextModule.label} Module →
          </Link>
        )}
        <Link href={`/dashboard/attempts/${attemptId}`}>View full attempt breakdown</Link>
      </div>
    </div>
  );
}
