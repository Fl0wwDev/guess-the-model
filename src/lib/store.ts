import { create } from "zustand";

export type QuizStatus = "idle" | "playing" | "revealed" | "finished";

interface QuizState {
  status: QuizStatus;
  score: number;
  questionIndex: number;
  start: () => void;
  answer: (correct: boolean) => void;
  next: () => void;
  reset: () => void;
}

/**
 * Skeleton quiz store. The game loop (question bank, model swapping, scoring)
 * builds on top of this in Phase 4.
 */
export const useQuizStore = create<QuizState>((set) => ({
  status: "idle",
  score: 0,
  questionIndex: 0,
  start: () => set({ status: "playing", score: 0, questionIndex: 0 }),
  answer: (correct) =>
    set((s) => ({ status: "revealed", score: correct ? s.score + 1 : s.score })),
  next: () => set((s) => ({ status: "playing", questionIndex: s.questionIndex + 1 })),
  reset: () => set({ status: "idle", score: 0, questionIndex: 0 }),
}));
