import { seedQuestions } from "../data/questions";
import type { AppData } from "../types";
import { createReviewState } from "./scheduler";

const STORAGE_KEY = "flashcode:data:v1";

export function createInitialData(now = new Date()): AppData {
  return {
    questions: seedQuestions,
    reviews: Object.fromEntries(
      seedQuestions.map((question) => [question.id, createReviewState(question.id, now)]),
    ),
    history: [],
    drafts: {},
  };
}

export function loadData(): AppData {
  if (typeof window === "undefined") return createInitialData();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialData();

    const parsed = JSON.parse(raw) as AppData;
    if (!Array.isArray(parsed.questions) || !parsed.reviews || !Array.isArray(parsed.history)) {
      return createInitialData();
    }

    return { ...parsed, drafts: parsed.drafts ?? {} };
  } catch {
    return createInitialData();
  }
}

export function saveData(data: AppData): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearData(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
