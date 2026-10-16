import { seedQuestions } from "./catalog";
import { DEFAULT_PLAN_ID, studyPlans } from "./studyPlans";
import type { AppData } from "../types";
import { createReviewState, migrateLegacyReviewState } from "./scheduler";
import { normalizeStudySession } from "./session";

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
    activeSession: null,
    completedSessions: [],
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
      reviews[question.id] = reviews[question.id]
        ? migrateLegacyReviewState(reviews[question.id])
        : createReviewState(question.id);
    }
    const activePlanId = studyPlans.some((plan) => plan.id === parsed.activePlanId)
      ? parsed.activePlanId
      : DEFAULT_PLAN_ID;
    const activeSession = normalizeStudySession(
      parsed.activeSession,
      new Set(questions.map((question) => question.id)),
      new Set(studyPlans.map((plan) => plan.id)),
    );

    return {
      ...parsed,
      questions,
      reviews,
      drafts: parsed.drafts ?? {},
      activePlanId,
      activeSession,
      completedSessions: Array.isArray(parsed.completedSessions) ? parsed.completedSessions : [],
    };
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
