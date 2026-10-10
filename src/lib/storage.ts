import { seedQuestions } from "../data/questions";
import { DEFAULT_PLAN_ID, studyPlans } from "../data/studyPlans";
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
    activePlanId: DEFAULT_PLAN_ID,
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

    const seedByUrl = new Map(seedQuestions.map((question) => [question.url, question]));
    const storedQuestions = parsed.questions.map((question) => {
      const seed = seedByUrl.get(question.url);
      return seed ? { ...seed, id: question.id } : question;
    });
    const storedUrls = new Set(storedQuestions.map((question) => question.url));
    const questions = [
      ...storedQuestions,
      ...seedQuestions.filter((question) => !storedUrls.has(question.url)),
    ];
    const reviews = { ...parsed.reviews };
    for (const question of questions) {
      reviews[question.id] ??= createReviewState(question.id);
    }
    const activePlanId = studyPlans.some((plan) => plan.id === parsed.activePlanId)
      ? parsed.activePlanId
      : DEFAULT_PLAN_ID;

    return { ...parsed, questions, reviews, drafts: parsed.drafts ?? {}, activePlanId };
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
