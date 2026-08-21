"use client";

import { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import type { ModuleInput, QuestionType } from "@/lib/validation/testSchemas";
import { createDefaultQuestionGroup } from "@/lib/admin/questionDefaults";
import { QuestionGroupEditor } from "./QuestionGroupEditor";
import { FileUploadField } from "./FileUploadField";

const QUESTION_TYPES: QuestionType[] = [
  "MULTIPLE_CHOICE",
  "TRUE_FALSE_NOT_GIVEN",
  "MATCHING_HEADINGS",
  "SENTENCE_COMPLETION",
  "MAP_LABELING",
];

/** Editor for one module's full content tree. Rendered once per tab (Listening/Reading/Writing/Speaking). */
export function ModuleEditor({ moduleType }: { moduleType: ModuleInput["type"] }) {
  const { register, control, setValue, getValues } = useFormContext<ModuleInput>();
  const [newGroupType, setNewGroupType] = useState<QuestionType>("MULTIPLE_CHOICE");

  const passages = useFieldArray({ control, name: "passages" });
  const audioTracks = useFieldArray({ control, name: "audioTracks" });
  const questionGroups = useFieldArray({ control, name: "questionGroups" });
  const writingTasks = useFieldArray({ control, name: "writingTasks" });
  const speakingParts = useFieldArray({ control, name: "speakingParts" });

  return (
    <div className="ielts-builder-module">
      <label>
        Time Limit (minutes)
        <input type="number" {...register("timeLimitMinutes", { valueAsNumber: true })} />
      </label>

      {moduleType === "READING" && (
        <section>
          <h3>Passages</h3>
          {passages.fields.map((field, i) => (
            <div key={field.id} className="ielts-builder-passage">
              <input placeholder="Title" {...register(`passages.${i}.title`)} />
              <input type="number" placeholder="Order" {...register(`passages.${i}.order`, { valueAsNumber: true })} />
              <textarea placeholder="Passage body text" rows={8} {...register(`passages.${i}.bodyText`)} />
              <button type="button" onClick={() => passages.remove(i)}>
                Remove Passage
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => passages.append({ id: crypto.randomUUID(), order: passages.fields.length + 1, title: "", bodyText: "" })}
          >
            + Add Passage
          </button>
        </section>
      )}

      {moduleType === "LISTENING" && (
        <section>
          <h3>Audio Tracks</h3>
          {audioTracks.fields.map((field, i) => (
            <div key={field.id} className="ielts-builder-audio-track">
              <input placeholder="Title (e.g. Section 1)" {...register(`audioTracks.${i}.title`)} />
              <input type="number" placeholder="Order" {...register(`audioTracks.${i}.order`, { valueAsNumber: true })} />
              <FileUploadField
                label="Upload audio file"
                accept="audio/*"
                value={getValues(`audioTracks.${i}.audioUrl`)}
                onUploaded={(url) => setValue(`audioTracks.${i}.audioUrl`, url, { shouldValidate: true, shouldDirty: true })}
              />
              <input
                type="number"
                placeholder="Duration (seconds)"
                {...register(`audioTracks.${i}.durationSeconds`, { valueAsNumber: true })}
              />
              <textarea placeholder="Transcript (optional)" rows={4} {...register(`audioTracks.${i}.transcript`)} />
              <button type="button" onClick={() => audioTracks.remove(i)}>
                Remove Track
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              audioTracks.append({
                id: crypto.randomUUID(),
                order: audioTracks.fields.length + 1,
                title: "",
                audioUrl: "",
                durationSeconds: 60,
              })
            }
          >
            + Add Audio Track
          </button>
        </section>
      )}

      {(moduleType === "READING" || moduleType === "LISTENING") && (
        <section>
          <h3>Question Groups</h3>
          {questionGroups.fields.map((field, i) => (
            <QuestionGroupEditor key={field.id} groupIndex={i} onRemove={() => questionGroups.remove(i)} />
          ))}

          <div className="ielts-builder-row">
            <select value={newGroupType} onChange={(e) => setNewGroupType(e.target.value as QuestionType)}>
              {QUESTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => questionGroups.append(createDefaultQuestionGroup(newGroupType, questionGroups.fields.length + 1))}
            >
              + Add Question Group
            </button>
          </div>
        </section>
      )}

      {moduleType === "WRITING" && (
        <section>
          <h3>Writing Tasks</h3>
          {writingTasks.fields.map((field, i) => (
            <div key={field.id} className="ielts-builder-writing-task">
              <label>
                Task Number
                <select {...register(`writingTasks.${i}.taskNumber`, { valueAsNumber: true })}>
                  <option value={1}>Task 1</option>
                  <option value={2}>Task 2</option>
                </select>
              </label>
              <textarea placeholder="Prompt" rows={4} {...register(`writingTasks.${i}.prompt`)} />
              <FileUploadField
                label="Upload chart/graph/diagram (Task 1 Academic only)"
                accept="image/*"
                value={getValues(`writingTasks.${i}.imageUrl`)}
                onUploaded={(url) => setValue(`writingTasks.${i}.imageUrl`, url, { shouldValidate: true, shouldDirty: true })}
              />
              <input type="number" placeholder="Min words" {...register(`writingTasks.${i}.minWords`, { valueAsNumber: true })} />
              <input
                type="number"
                placeholder="Time limit (minutes)"
                {...register(`writingTasks.${i}.timeLimitMinutes`, { valueAsNumber: true })}
              />
              <button type="button" onClick={() => writingTasks.remove(i)}>
                Remove Task
              </button>
            </div>
          ))}
          {writingTasks.fields.length < 2 && (
            <button
              type="button"
              onClick={() =>
                writingTasks.append({
                  id: crypto.randomUUID(),
                  taskNumber: writingTasks.fields.length === 0 ? 1 : 2,
                  prompt: "",
                  minWords: writingTasks.fields.length === 0 ? 150 : 250,
                  timeLimitMinutes: writingTasks.fields.length === 0 ? 20 : 40,
                })
              }
            >
              + Add Writing Task
            </button>
          )}
        </section>
      )}

      {moduleType === "SPEAKING" && (
        <section>
          <h3>Speaking Parts</h3>
          {speakingParts.fields.map((field, i) => (
            <div key={field.id} className="ielts-builder-speaking-part">
              <label>
                Part Number
                <select {...register(`speakingParts.${i}.partNumber`, { valueAsNumber: true })}>
                  <option value={1}>Part 1</option>
                  <option value={2}>Part 2</option>
                  <option value={3}>Part 3</option>
                </select>
              </label>
              <textarea placeholder="Cue card text (Part 2 only)" rows={3} {...register(`speakingParts.${i}.cueCardText`)} />
              <input
                type="number"
                placeholder="Prep time (seconds)"
                {...register(`speakingParts.${i}.prepTimeSeconds`, { valueAsNumber: true })}
              />
              <input
                type="number"
                placeholder="Speaking time (seconds)"
                {...register(`speakingParts.${i}.speakingTimeSeconds`, { valueAsNumber: true })}
              />
              <textarea
                placeholder="Questions, one per line"
                rows={4}
                defaultValue={getValues(`speakingParts.${i}.questions`)?.join("\n")}
                onChange={(e) =>
                  setValue(
                    `speakingParts.${i}.questions`,
                    e.target.value.split("\n").filter(Boolean),
                    { shouldValidate: true, shouldDirty: true }
                  )
                }
              />
              <button type="button" onClick={() => speakingParts.remove(i)}>
                Remove Part
              </button>
            </div>
          ))}
          {speakingParts.fields.length < 3 && (
            <button
              type="button"
              onClick={() =>
                speakingParts.append({
                  id: crypto.randomUUID(),
                  partNumber: (speakingParts.fields.length + 1) as 1 | 2 | 3,
                  questions: [],
                })
              }
            >
              + Add Speaking Part
            </button>
          )}
        </section>
      )}
    </div>
  );
}
