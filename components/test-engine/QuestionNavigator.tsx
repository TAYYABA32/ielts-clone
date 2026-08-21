"use client";

import { useTestStore } from "@/lib/store/testStore";

interface QuestionNavigatorProps {
  onSubmitClick: () => void;
}

/** Grid of question numbers colour-coded by status, plus the answered/flagged/unattempted summary and submit button. */
export function QuestionNavigator({ onSubmitClick }: QuestionNavigatorProps) {
  const questionOrder = useTestStore((s) => s.questionOrder);
  const activeQuestionId = useTestStore((s) => s.activeQuestionId);
  const setActiveQuestion = useTestStore((s) => s.setActiveQuestion);
  const getQuestionStatus = useTestStore((s) => s.getQuestionStatus);
  const counts = useTestStore((s) => s.getCounts());

  const scrollToQuestion = (questionId: string) => {
    setActiveQuestion(questionId);
    document.querySelector(`[data-question-id="${questionId}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <nav className="ielts-navigator" aria-label="Question navigator" data-testid="question-navigator">
      <div className="ielts-navigator__summary">
        <span className="ielts-navigator__stat ielts-navigator__stat--answered">Answered: {counts.answered}</span>
        <span className="ielts-navigator__stat ielts-navigator__stat--flagged">Flagged: {counts.flagged}</span>
        <span className="ielts-navigator__stat ielts-navigator__stat--unattempted">Unattempted: {counts.unattempted}</span>
      </div>

      <div className="ielts-navigator__grid">
        {questionOrder.map((q) => {
          const status = getQuestionStatus(q.id);
          const isActive = q.id === activeQuestionId;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => scrollToQuestion(q.id)}
              className={[
                "ielts-navigator__item",
                `ielts-navigator__item--${status}`,
                isActive ? "ielts-navigator__item--active" : "",
              ].join(" ")}
              aria-current={isActive}
              aria-label={`Question ${q.order}, ${status}`}
            >
              {q.order}
            </button>
          );
        })}
      </div>

      <button type="button" className="ielts-navigator__submit" onClick={onSubmitClick}>
        Submit Test
      </button>
    </nav>
  );
}
