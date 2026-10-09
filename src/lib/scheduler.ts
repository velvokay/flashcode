import type { Rating, ReviewState } from "../types";

const DAY_MS = 24 * 60 * 60 * 1000;
const AGAIN_DELAY_MS = 8 * 60 * 1000;

export interface SchedulePreview {
  label: string;
  dueAt: Date;
  intervalDays: number;
}

function roundedDays(value: number): number {
  return Math.max(1, Math.round(value));
}

export function previewSchedule(
  state: ReviewState,
  rating: Rating,
  now = new Date(),
): SchedulePreview {
  if (rating === "again") {
    return {
      label: "8 min",
      dueAt: new Date(now.getTime() + AGAIN_DELAY_MS),
      intervalDays: 0,
    };
  }

  let intervalDays: number;

  if (rating === "hard") {
    intervalDays = state.repetitions === 0 ? 1 : roundedDays(state.intervalDays * 1.2);
  } else if (rating === "good") {
    if (state.repetitions === 0) intervalDays = 2;
    else if (state.repetitions === 1) intervalDays = 4;
    else intervalDays = roundedDays(state.intervalDays * state.ease);
  } else {
    intervalDays =
      state.repetitions === 0
        ? 4
        : roundedDays(state.intervalDays * (state.ease + 0.15) * 1.3);
  }

  return {
    label: intervalDays === 1 ? "1 day" : `${intervalDays} days`,
    dueAt: new Date(now.getTime() + intervalDays * DAY_MS),
    intervalDays,
  };
}

export function applyRating(
  state: ReviewState,
  rating: Rating,
  now = new Date(),
): ReviewState {
  const preview = previewSchedule(state, rating, now);
  const failed = rating === "again";

  return {
    ...state,
    dueAt: preview.dueAt.toISOString(),
    intervalDays: preview.intervalDays,
    ease: Math.min(
      3,
      Math.max(1.3, state.ease + (rating === "easy" ? 0.15 : failed ? -0.2 : 0)),
    ),
    repetitions: failed ? 0 : state.repetitions + 1,
    lapses: state.lapses + (failed ? 1 : 0),
    lastReviewedAt: now.toISOString(),
  };
}

export function createReviewState(questionId: string, now = new Date()): ReviewState {
  return {
    questionId,
    dueAt: now.toISOString(),
    intervalDays: 0,
    ease: 2.5,
    repetitions: 0,
    lapses: 0,
  };
}

export function isDue(state: ReviewState, now = new Date()): boolean {
  return new Date(state.dueAt).getTime() <= now.getTime();
}

export function formatDueDate(iso: string, now = new Date()): string {
  const due = new Date(iso);
  const delta = due.getTime() - now.getTime();

  if (delta <= 0) return "Due now";
  if (delta < 60 * 60 * 1000) return `In ${Math.max(1, Math.ceil(delta / 60000))} min`;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const dayDelta = Math.round((target.getTime() - today.getTime()) / DAY_MS);

  if (dayDelta === 0) return "Later today";
  if (dayDelta === 1) return "Tomorrow";
  if (dayDelta < 7) return due.toLocaleDateString(undefined, { weekday: "long" });

  return due.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
