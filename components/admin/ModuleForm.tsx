"use client";

import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { moduleSchema, type ModuleInput } from "@/lib/validation/testSchemas";
import { ModuleEditor } from "./ModuleEditor";

interface ModuleFormProps {
  testId: string;
  moduleId?: string;
  defaultValues: ModuleInput;
  onSaved: (moduleId: string) => void;
}

/** One module's save unit: its own form, its own resolver, its own POST/PATCH — the Test Builder mounts one of these per active tab. */
export function ModuleForm({ testId, moduleId, defaultValues, onSaved }: ModuleFormProps) {
  const methods = useForm<ModuleInput>({ resolver: zodResolver(moduleSchema), defaultValues, mode: "onBlur" });
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const onSubmit = methods.handleSubmit(async (data) => {
    setSaveState("saving");
    setSaveError(null);
    try {
      const url = moduleId ? `/api/admin/tests/${testId}/modules/${moduleId}` : `/api/admin/tests/${testId}/modules`;
      const response = await fetch(url, {
        method: moduleId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Save failed");
      }
      const result = await response.json();
      setSaveState("saved");
      onSaved(result.moduleId ?? result.module?.id ?? moduleId ?? "");
    } catch (err) {
      setSaveState("error");
      setSaveError(err instanceof Error ? err.message : "Save failed");
    }
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="ielts-builder-form">
        <ModuleEditor moduleType={defaultValues.type} />

        <div className="ielts-builder-form__actions">
          <button type="submit" disabled={saveState === "saving"}>
            {saveState === "saving" ? "Saving…" : "Save Module"}
          </button>
          {saveState === "saved" && <span className="ielts-builder-form__status--ok">Saved ✓</span>}
          {saveState === "error" && <span className="ielts-builder-form__status--error">{saveError}</span>}
          {Object.keys(methods.formState.errors).length > 0 && (
            <span className="ielts-builder-form__status--error">
              Fix validation errors before saving ({Object.keys(methods.formState.errors).length} field group{Object.keys(methods.formState.errors).length === 1 ? "" : "s"})
            </span>
          )}
        </div>
      </form>
    </FormProvider>
  );
}
