import { create } from "zustand";
import type { ClientGradableModule, ClientQuestion, ModuleType, UserAnswerMap } from "@/types/test";

export type QuestionStatus = "unattempted" | "answered" | "flagged";

interface QuestionMeta {
  id: string;
  order: number;
  groupId: string;
}

interface TestState {
  moduleType: ModuleType | null;
  module: ClientGradableModule | null;
  attemptId: string | null;
  moduleId: string | null;

  // Flattened, ordered list of every question in the module — drives the
  // navigator grid and lets us find "next unattempted" in O(n).
  questionOrder: QuestionMeta[];

  answers: UserAnswerMap;
  flagged: Record<string, boolean>;
  timeSpentPerQuestion: Record<string, number>;

  activeQuestionId: string | null;
  remainingSeconds: number;
  isSubmitted: boolean;

  // --- actions ---
  initModule: (params: {
    moduleType: ModuleType;
    module: ClientGradableModule;
    attemptId: string;
    moduleId: string;
    initialAnswers?: UserAnswerMap;
    initialFlagged?: Record<string, boolean>;
    remainingSeconds: number;
  }) => void;
  setAnswer: (questionId: string, value: string | string[]) => void;
  clearAnswer: (questionId: string) => void;
  toggleFlag: (questionId: string) => void;
  setActiveQuestion: (questionId: string) => void;
  addTimeSpent: (questionId: string, deltaSeconds: number) => void;
  tickTimer: () => void;
  getQuestionStatus: (questionId: string) => QuestionStatus;
  getCounts: () => { answered: number; flagged: number; unattempted: number; total: number };
  markSubmitted: () => void;
  reset: () => void;
}

function flattenQuestions(module: ClientGradableModule): QuestionMeta[] {
  const all: QuestionMeta[] = [];
  for (const group of [...module.questionGroups].sort((a, b) => a.order - b.order)) {
    for (const q of [...group.questions].sort((a, b) => a.order - b.order)) {
      all.push({ id: q.id, order: q.order, groupId: group.id });
    }
  }
  return all;
}

function isAnswered(value: string | string[] | undefined): boolean {
  if (value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  return value.trim().length > 0;
}

export const useTestStore = create<TestState>((set, get) => ({
  moduleType: null,
  module: null,
  attemptId: null,
  moduleId: null,
  questionOrder: [],
  answers: {},
  flagged: {},
  timeSpentPerQuestion: {},
  activeQuestionId: null,
  remainingSeconds: 0,
  isSubmitted: false,

  initModule: ({ moduleType, module, attemptId, moduleId, initialAnswers, initialFlagged, remainingSeconds }) => {
    const questionOrder = flattenQuestions(module);
    set({
      moduleType,
      module,
      attemptId,
      moduleId,
      questionOrder,
      answers: initialAnswers ?? {},
      flagged: initialFlagged ?? {},
      timeSpentPerQuestion: {},
      activeQuestionId: questionOrder[0]?.id ?? null,
      remainingSeconds,
      isSubmitted: false,
    });
  },

  setAnswer: (questionId, value) => {
    set((state) => ({
      answers: { ...state.answers, [questionId]: value },
    }));
  },

  clearAnswer: (questionId) => {
    set((state) => {
      const next = { ...state.answers };
      delete next[questionId];
      return { answers: next };
    });
  },

  toggleFlag: (questionId) => {
    set((state) => ({
      flagged: { ...state.flagged, [questionId]: !state.flagged[questionId] },
    }));
  },

  setActiveQuestion: (questionId) => {
    set({ activeQuestionId: questionId });
  },

  addTimeSpent: (questionId, deltaSeconds) => {
    set((state) => ({
      timeSpentPerQuestion: {
        ...state.timeSpentPerQuestion,
        [questionId]: (state.timeSpentPerQuestion[questionId] ?? 0) + deltaSeconds,
      },
    }));
  },

  tickTimer: () => {
    set((state) => ({ remainingSeconds: Math.max(0, state.remainingSeconds - 1) }));
  },

  getQuestionStatus: (questionId) => {
    const state = get();
    if (state.flagged[questionId]) return "flagged";
    if (isAnswered(state.answers[questionId])) return "answered";
    return "unattempted";
  },

  getCounts: () => {
    const state = get();
    let answered = 0;
    let flagged = 0;
    for (const q of state.questionOrder) {
      if (state.flagged[q.id]) flagged += 1;
      if (isAnswered(state.answers[q.id])) answered += 1;
    }
    return {
      answered,
      flagged,
      unattempted: state.questionOrder.length - answered,
      total: state.questionOrder.length,
    };
  },

  markSubmitted: () => set({ isSubmitted: true }),

  reset: () =>
    set({
      moduleType: null,
      module: null,
      attemptId: null,
      moduleId: null,
      questionOrder: [],
      answers: {},
      flagged: {},
      timeSpentPerQuestion: {},
      activeQuestionId: null,
      remainingSeconds: 0,
      isSubmitted: false,
    }),
}));

// Convenience selector: is this specific question answered right now.
export function useIsQuestionAnswered(question: ClientQuestion): boolean {
  return useTestStore((s) => isAnswered(s.answers[question.id]));
}
