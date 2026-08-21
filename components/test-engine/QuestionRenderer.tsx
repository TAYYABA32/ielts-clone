"use client";

import { useEffect, useRef } from "react";
import { useTestStore } from "@/lib/store/testStore";
import type {
  ClientMapLabelingQuestion,
  ClientMatchingHeadingsQuestion,
  ClientMultipleChoiceQuestion,
  ClientQuestion,
  ClientQuestionGroup,
  ClientSentenceCompletionQuestion,
  ClientTrueFalseNotGivenQuestion,
  OptionItem,
} from "@/types/test";

interface QuestionRendererProps {
  question: ClientQuestion;
  group: ClientQuestionGroup;
}

/** Tracks wall-clock seconds spent with this question active, flushed to the store on unmount/switch. */
function useQuestionTimeTracking(questionId: string) {
  const addTimeSpent = useTestStore((s) => s.addTimeSpent);
  const enteredAtRef = useRef<number>(performance.now());

  useEffect(() => {
    enteredAtRef.current = performance.now();
    return () => {
      const elapsedSeconds = Math.round((performance.now() - enteredAtRef.current) / 1000);
      if (elapsedSeconds > 0) addTimeSpent(questionId, elapsedSeconds);
    };
  }, [questionId, addTimeSpent]);
}

function MultipleChoiceInput({ question }: { question: ClientMultipleChoiceQuestion }) {
  const answer = useTestStore((s) => s.answers[question.id]);
  const setAnswer = useTestStore((s) => s.setAnswer);

  const selectedKeys = new Set(Array.isArray(answer) ? answer : answer ? [answer] : []);

  const handleSelect = (key: string) => {
    if (question.allowMultipleSelect) {
      const next = new Set(selectedKeys);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      setAnswer(question.id, Array.from(next));
    } else {
      setAnswer(question.id, key);
    }
  };

  return (
    <fieldset className="ielts-question__options">
      <legend className="sr-only">{question.prompt}</legend>
      {question.options.map((opt: OptionItem) => (
        <label key={opt.key} className="ielts-question__option">
          <input
            type={question.allowMultipleSelect ? "checkbox" : "radio"}
            name={`question-${question.id}`}
            checked={selectedKeys.has(opt.key)}
            onChange={() => handleSelect(opt.key)}
          />
          <span className="ielts-question__option-key">{opt.key}</span>
          <span>{opt.text}</span>
        </label>
      ))}
    </fieldset>
  );
}

function TrueFalseNotGivenInput({ question }: { question: ClientTrueFalseNotGivenQuestion }) {
  const answer = useTestStore((s) => s.answers[question.id]);
  const setAnswer = useTestStore((s) => s.setAnswer);
  const options: Array<"TRUE" | "FALSE" | "NOT_GIVEN"> = ["TRUE", "FALSE", "NOT_GIVEN"];

  return (
    <fieldset className="ielts-question__options">
      <legend>{question.statement}</legend>
      {options.map((opt) => (
        <label key={opt} className="ielts-question__option">
          <input
            type="radio"
            name={`question-${question.id}`}
            checked={answer === opt}
            onChange={() => setAnswer(question.id, opt)}
          />
          <span>{opt.replace("_", " ")}</span>
        </label>
      ))}
    </fieldset>
  );
}

function MatchingHeadingsInput({ question, group }: { question: ClientMatchingHeadingsQuestion; group: ClientQuestionGroup }) {
  const answer = useTestStore((s) => s.answers[question.id]);
  const setAnswer = useTestStore((s) => s.setAnswer);
  const headings = group.groupData?.headings ?? [];

  return (
    <div className="ielts-question__matching">
      <span className="ielts-question__matching-label">{question.paragraphLabel}</span>
      <select
        value={typeof answer === "string" ? answer : ""}
        onChange={(e) => setAnswer(question.id, e.target.value)}
        aria-label={`Select heading for ${question.paragraphLabel}`}
      >
        <option value="" disabled>
          Select a heading…
        </option>
        {headings.map((h) => (
          <option key={h.key} value={h.key}>
            {h.key}. {h.text}
          </option>
        ))}
      </select>
    </div>
  );
}

function SentenceCompletionInput({ question }: { question: ClientSentenceCompletionQuestion }) {
  const answer = useTestStore((s) => s.answers[question.id]);
  const setAnswer = useTestStore((s) => s.setAnswer);
  const [before, after] = question.textWithBlank.split("___");
  const value = typeof answer === "string" ? answer : "";
  const wordCount = value.trim().length === 0 ? 0 : value.trim().split(/\s+/).length;
  const overLimit = wordCount > question.maxWords;

  return (
    <div className="ielts-question__sentence">
      <span>{before}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => setAnswer(question.id, e.target.value)}
        aria-invalid={overLimit}
        aria-describedby={`word-limit-${question.id}`}
        className="ielts-question__sentence-blank"
      />
      <span>{after}</span>
      <span id={`word-limit-${question.id}`} className={`ielts-question__word-limit ${overLimit ? "ielts-question__word-limit--over" : ""}`}>
        Max {question.maxWords} word{question.maxWords > 1 ? "s" : ""} ({wordCount})
      </span>
    </div>
  );
}

function MapLabelingInput({ question, group }: { question: ClientMapLabelingQuestion; group: ClientQuestionGroup }) {
  const answer = useTestStore((s) => s.answers[question.id]);
  const setAnswer = useTestStore((s) => s.setAnswer);
  const options = group.groupData?.options ?? [];
  const point = group.groupData?.mapPoints?.find((p) => p.id === question.labelPointId);

  return (
    <div className="ielts-question__map-label">
      {point && <span className="ielts-question__map-point-ref">Point {question.labelPointId}</span>}
      <select
        value={typeof answer === "string" ? answer : ""}
        onChange={(e) => setAnswer(question.id, e.target.value)}
        aria-label={`Select label for point ${question.labelPointId}`}
      >
        <option value="" disabled>
          Select…
        </option>
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.key}. {o.text}
          </option>
        ))}
      </select>
    </div>
  );
}

export function QuestionRenderer({ question, group }: QuestionRendererProps) {
  useQuestionTimeTracking(question.id);
  const flagged = useTestStore((s) => s.flagged[question.id]);
  const toggleFlag = useTestStore((s) => s.toggleFlag);
  const setActiveQuestion = useTestStore((s) => s.setActiveQuestion);

  return (
    <div
      className="ielts-question"
      data-question-id={question.id}
      onFocus={() => setActiveQuestion(question.id)}
      tabIndex={-1}
    >
      <div className="ielts-question__header">
        <span className="ielts-question__number">{question.order}</span>
        {question.prompt && <span className="ielts-question__prompt">{question.prompt}</span>}
        <button
          type="button"
          className={`ielts-question__flag ${flagged ? "ielts-question__flag--active" : ""}`}
          onClick={() => toggleFlag(question.id)}
          aria-pressed={!!flagged}
          aria-label={flagged ? "Remove flag for review" : "Flag for review"}
        >
          🚩
        </button>
      </div>

      {question.type === "MULTIPLE_CHOICE" && <MultipleChoiceInput question={question} />}
      {question.type === "TRUE_FALSE_NOT_GIVEN" && <TrueFalseNotGivenInput question={question} />}
      {question.type === "MATCHING_HEADINGS" && <MatchingHeadingsInput question={question} group={group} />}
      {question.type === "SENTENCE_COMPLETION" && <SentenceCompletionInput question={question} />}
      {question.type === "MAP_LABELING" && <MapLabelingInput question={question} group={group} />}
    </div>
  );
}
