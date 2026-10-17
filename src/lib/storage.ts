import { seedQuestions } from "./catalog";
import { DEFAULT_PLAN_ID, studyPlans } from "./studyPlans";
import type { AppData, ReviewState } from "../types";
import { createReviewState, migrateLegacyReviewState } from "./scheduler";
import { normalizeStudySession } from "./session";

const STORAGE_KEY = "flashcode:data";
const LEGACY_STORAGE_KEYS = ["flashcode:data:v1"];
export const STORAGE_SCHEMA_VERSION = 1;

interface StorageEnvelope {
  product: "flashcode";
  schemaVersion: number;
  savedAt: string;
  data: AppData;
}

export interface FlashcodeBackup extends StorageEnvelope {
  exportedAt: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function unwrapStoredData(value: unknown): unknown {
  if (!isRecord(value) || !("schemaVersion" in value)) return value;
  if (value.product !== "flashcode") return null;
  if (value.schemaVersion !== STORAGE_SCHEMA_VERSION) return null;
  return value.data;
}

function normalizeAppData(value: unknown, now = new Date()): AppData | null {
  if (!isRecord(value)) return null;
  if (!Array.isArray(value.questions) || !isRecord(value.reviews) || !Array.isArray(value.history)) {
    return null;
  }

  const parsed = value as unknown as AppData;
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
  const reviews = { ...(parsed.reviews as Record<string, ReviewState>) };
  for (const question of questions) {
    reviews[question.id] = reviews[question.id]
      ? migrateLegacyReviewState(reviews[question.id])
      : createReviewState(question.id, now);
  }

  const activePlanId = studyPlans.some((plan) => plan.id === parsed.activePlanId)
    ? parsed.activePlanId
    : DEFAULT_PLAN_ID;
  const activeSession = normalizeStudySession(
    parsed.activeSession,
    new Set(questions.map((question) => question.id)),
    new Set(studyPlans.map((plan) => plan.id)),
    now,
  );

  return {
    ...parsed,
    questions,
    reviews,
    drafts: isRecord(parsed.drafts) ? parsed.drafts : {},
    activePlanId,
    activeSession,
    completedSessions: Array.isArray(parsed.completedSessions) ? parsed.completedSessions : [],
  };
}

function storageEnvelope(data: AppData, now = new Date()): StorageEnvelope {
  return {
    product: "flashcode",
    schemaVersion: STORAGE_SCHEMA_VERSION,
    savedAt: now.toISOString(),
    data,
  };
}

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

export function loadData(now = new Date()): AppData {
  if (typeof window === "undefined") return createInitialData(now);

  for (const key of [STORAGE_KEY, ...LEGACY_STORAGE_KEYS]) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const data = normalizeAppData(unwrapStoredData(JSON.parse(raw)), now);
      if (data) return data;
    } catch {
      // Try the next known storage format before falling back to fresh data.
    }
  }

  return createInitialData(now);
}

export function saveData(data: AppData, now = new Date()): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storageEnvelope(data, now)));
  for (const key of LEGACY_STORAGE_KEYS) window.localStorage.removeItem(key);
}

export function createBackup(data: AppData, now = new Date()): string {
  const envelope: FlashcodeBackup = {
    ...storageEnvelope(data, now),
    exportedAt: now.toISOString(),
  };
  return JSON.stringify(envelope, null, 2);
}

export function parseBackup(raw: string, now = new Date()): AppData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("This file is not valid JSON.");
  }

  if (!isRecord(parsed) || parsed.product !== "flashcode") {
    throw new Error("This is not a Flashcode backup.");
  }
  if (parsed.schemaVersion !== STORAGE_SCHEMA_VERSION) {
    throw new Error("This backup was created by an unsupported Flashcode version.");
  }

  let data: AppData | null = null;
  try {
    data = normalizeAppData(parsed.data, now);
  } catch {
    // Treat malformed nested data like any other damaged backup.
  }
  if (!data) throw new Error("This Flashcode backup is incomplete or damaged.");
  return data;
}

export function clearData(): void {
  window.localStorage.removeItem(STORAGE_KEY);
  for (const key of LEGACY_STORAGE_KEYS) window.localStorage.removeItem(key);
}
