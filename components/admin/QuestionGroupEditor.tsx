"use client";

import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import type { ModuleInput, QuestionType } from "@/lib/validation/testSchemas";
import { createDefaultQuestion } from "@/lib/admin/questionDefaults";
import { FileUploadField } from "./FileUploadField";

interface QuestionGroupEditorProps {
  groupIndex: number;
  onRemove: () => void;
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: "Multiple Choice",
  TRUE_FALSE_NOT_GIVEN: "True / False / Not Given",
  MATCHING_HEADINGS: "Matching Headings",
  SENTENCE_COMPLETION: "Sentence Completion",
  MAP_LABELING: "Map Labeling",
};

export function QuestionGroupEditor({ groupIndex, onRemove }: QuestionGroupEditorProps) {
  const { register, control, setValue } = useFormContext<ModuleInput>();
  const groupType = useWatch({ control, name: `questionGroups.${groupIndex}.type` }) as QuestionType;
  const mapImageUrl = useWatch({ control, name: `questionGroups.${groupIndex}.groupData.mapImageUrl` });

  const {
    fields: questionFields,
    append: appendQuestion,
    remove: removeQuestion,
  } = useFieldArray({ control, name: `questionGroups.${groupIndex}.questions` });

  const headingsArray = useFieldArray({ control, name: `questionGroups.${groupIndex}.groupData.headings` });
  const mapPointsArray = useFieldArray({ control, name: `questionGroups.${groupIndex}.groupData.mapPoints` });
  const mapOptionsArray = useFieldArray({ control, name: `questionGroups.${groupIndex}.groupData.options` });

  return (
    <fieldset className="ielts-builder-group">
      <legend>
        {QUESTION_TYPE_LABELS[groupType]} — Questions {questionFields[0] ? "starting" : ""}
      </legend>

      <label>
        Instructions
        <textarea {...register(`questionGroups.${groupIndex}.instructions`)} rows={2} />
      </label>
      <label>
        Order
        <input type="number" {...register(`questionGroups.${groupIndex}.order`, { valueAsNumber: true })} />
      </label>

      {groupType === "MATCHING_HEADINGS" && (
        <div className="ielts-builder-group__headings">
          <h4>Candidate Headings</h4>
          {headingsArray.fields.map((field, i) => (
            <div key={field.id} className="ielts-builder-row">
              <input placeholder="Key (e.g. i, ii, iii)" {...register(`questionGroups.${groupIndex}.groupData.headings.${i}.key`)} />
              <input placeholder="Heading text" {...register(`questionGroups.${groupIndex}.groupData.headings.${i}.text`)} />
              <button type="button" onClick={() => headingsArray.remove(i)}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={() => headingsArray.append({ key: "", text: "" })}>
            + Add Heading
          </button>
        </div>
      )}

      {groupType === "MAP_LABELING" && (
        <div className="ielts-builder-group__map">
          <h4>Map Image</h4>
          <FileUploadField
            label="Upload map/diagram image"
            accept="image/*"
            value={mapImageUrl}
            onUploaded={(url) =>
              setValue(`questionGroups.${groupIndex}.groupData.mapImageUrl`, url, { shouldValidate: true, shouldDirty: true })
            }
          />

          <h4>Map Points</h4>
          {mapPointsArray.fields.map((field, i) => (
            <div key={field.id} className="ielts-builder-row">
              <input placeholder="Point ID" {...register(`questionGroups.${groupIndex}.groupData.mapPoints.${i}.id`)} />
              <input
                type="number"
                placeholder="X %"
                {...register(`questionGroups.${groupIndex}.groupData.mapPoints.${i}.x`, { valueAsNumber: true })}
              />
              <input
                type="number"
                placeholder="Y %"
                {...register(`questionGroups.${groupIndex}.groupData.mapPoints.${i}.y`, { valueAsNumber: true })}
              />
              <button type="button" onClick={() => mapPointsArray.remove(i)}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={() => mapPointsArray.append({ id: "", x: 50, y: 50 })}>
            + Add Point
          </button>

          <h4>Label Options</h4>
          {mapOptionsArray.fields.map((field, i) => (
            <div key={field.id} className="ielts-builder-row">
              <input placeholder="Key" {...register(`questionGroups.${groupIndex}.groupData.options.${i}.key`)} />
              <input placeholder="Text" {...register(`questionGroups.${groupIndex}.groupData.options.${i}.text`)} />
              <button type="button" onClick={() => mapOptionsArray.remove(i)}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={() => mapOptionsArray.append({ key: "", text: "" })}>
            + Add Option
          </button>
        </div>
      )}

      <h4>Questions</h4>
      {questionFields.map((field, qIndex) => (
        <div key={field.id} className="ielts-builder-question">
          <div className="ielts-builder-row">
            <input
              type="number"
              placeholder="Order"
              {...register(`questionGroups.${groupIndex}.questions.${qIndex}.order`, { valueAsNumber: true })}
            />
            <input
              type="number"
              step="0.5"
              placeholder="Points"
              {...register(`questionGroups.${groupIndex}.questions.${qIndex}.points`, { valueAsNumber: true })}
            />
            <button type="button" onClick={() => removeQuestion(qIndex)}>
              Remove Question
            </button>
          </div>

          {groupType === "MULTIPLE_CHOICE" && (
            <>
              <input placeholder="Prompt" {...register(`questionGroups.${groupIndex}.questions.${qIndex}.prompt`)} />
              <label>
                <input type="checkbox" {...register(`questionGroups.${groupIndex}.questions.${qIndex}.allowMultipleSelect`)} />
                Allow multiple select
              </label>
              <input
                placeholder="Option A text"
                {...register(`questionGroups.${groupIndex}.questions.${qIndex}.options.0.text`)}
              />
              <input
                placeholder="Option B text"
                {...register(`questionGroups.${groupIndex}.questions.${qIndex}.options.1.text`)}
              />
              <input
                placeholder="Correct answer key (e.g. A)"
                {...register(`questionGroups.${groupIndex}.questions.${qIndex}.correctAnswer`)}
              />
            </>
          )}

          {groupType === "TRUE_FALSE_NOT_GIVEN" && (
            <>
              <input placeholder="Statement" {...register(`questionGroups.${groupIndex}.questions.${qIndex}.statement`)} />
              <select {...register(`questionGroups.${groupIndex}.questions.${qIndex}.correctAnswer`)}>
                <option value="TRUE">TRUE</option>
                <option value="FALSE">FALSE</option>
                <option value="NOT_GIVEN">NOT GIVEN</option>
              </select>
            </>
          )}

          {groupType === "MATCHING_HEADINGS" && (
            <>
              <input
                placeholder="Paragraph label (e.g. Paragraph A)"
                {...register(`questionGroups.${groupIndex}.questions.${qIndex}.paragraphLabel`)}
              />
              <input
                placeholder="Correct heading key (e.g. iv)"
                {...register(`questionGroups.${groupIndex}.questions.${qIndex}.correctAnswer`)}
              />
            </>
          )}

          {groupType === "SENTENCE_COMPLETION" && (
            <>
              <input
                placeholder="Sentence with ___ blank"
                {...register(`questionGroups.${groupIndex}.questions.${qIndex}.textWithBlank`)}
              />
              <input
                type="number"
                placeholder="Max words"
                {...register(`questionGroups.${groupIndex}.questions.${qIndex}.maxWords`, { valueAsNumber: true })}
              />
              <input placeholder="Correct answer" {...register(`questionGroups.${groupIndex}.questions.${qIndex}.correctAnswer`)} />
              <label>
                <input type="checkbox" {...register(`questionGroups.${groupIndex}.questions.${qIndex}.caseSensitive`)} />
                Case sensitive
              </label>
            </>
          )}

          {groupType === "MAP_LABELING" && (
            <>
              <input
                placeholder="Label point ID (matches a Map Point above)"
                {...register(`questionGroups.${groupIndex}.questions.${qIndex}.labelPointId`)}
              />
              <input
                placeholder="Correct option key"
                {...register(`questionGroups.${groupIndex}.questions.${qIndex}.correctAnswer`)}
              />
            </>
          )}
        </div>
      ))}

      <button type="button" onClick={() => appendQuestion(createDefaultQuestion(groupType, questionFields.length + 1))}>
        + Add Question
      </button>

      <button type="button" className="ielts-builder-group__remove" onClick={onRemove}>
        Remove This Question Group
      </button>
    </fieldset>
  );
}
