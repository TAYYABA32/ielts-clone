"use client";

import { useState } from "react";
import type { ModuleInput } from "@/lib/validation/testSchemas";
import { createDefaultModule } from "@/lib/admin/defaultModule";
import { ModuleForm } from "./ModuleForm";

const MODULE_TABS: ModuleInput["type"][] = ["LISTENING", "READING", "WRITING", "SPEAKING"];

export interface LoadedModule {
  id: string;
  data: ModuleInput;
}

interface TestBuilderFormProps {
  testId: string;
  testTitle: string;
  /** Modules already saved for this test, keyed by type. Missing keys mean "not created yet". */
  existingModules: Partial<Record<ModuleInput["type"], LoadedModule>>;
}

/** Top-level Test Builder: one tab per IELTS module, each backed by its own ModuleForm/save action. */
export function TestBuilderForm({ testId, testTitle, existingModules: initialExisting }: TestBuilderFormProps) {
  const [activeTab, setActiveTab] = useState<ModuleInput["type"]>("LISTENING");
  const [existingModules, setExistingModules] = useState(initialExisting);

  const active = existingModules[activeTab];

  return (
    <div className="ielts-test-builder" data-testid="test-builder">
      <h1>{testTitle}</h1>

      <nav className="ielts-test-builder__tabs">
        {MODULE_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={tab === activeTab ? "ielts-test-builder__tab--active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {existingModules[tab] ? " ✓" : ""}
          </button>
        ))}
      </nav>

      <ModuleForm
        key={activeTab}
        testId={testId}
        moduleId={active?.id}
        defaultValues={active?.data ?? createDefaultModule(activeTab)}
        onSaved={(moduleId) =>
          setExistingModules((prev) => ({
            ...prev,
            [activeTab]: { id: moduleId, data: prev[activeTab]?.data ?? createDefaultModule(activeTab) },
          }))
        }
      />
    </div>
  );
}
