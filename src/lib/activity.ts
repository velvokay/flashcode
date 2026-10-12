import type { ReviewEvent } from "../types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDailyReviewCounts(history: ReviewEvent[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const event of history) {
    const key = dateKey(new Date(event.reviewedAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function previousDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
}

export function getStreaks(
  history: ReviewEvent[],
  now = new Date(),
): { current: number; longest: number } {
  const activeDays = new Set(getDailyReviewCounts(history).keys());
  if (activeDays.size === 0) return { current: 0, longest: 0 };

  const sortedDays = Array.from(activeDays)
    .map((key) => {
      const [year, month, day] = key.split("-").map(Number);
      return new Date(year, month - 1, day);
    })
    .sort((left, right) => left.getTime() - right.getTime());

  let longest = 1;
  let run = 1;
  for (let index = 1; index < sortedDays.length; index += 1) {
    const delta = startOfDay(sortedDays[index]).getTime() - startOfDay(sortedDays[index - 1]).getTime();
    run = delta === DAY_MS ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  let cursor = startOfDay(now);
  if (!activeDays.has(dateKey(cursor))) cursor = previousDay(cursor);

  let current = 0;
  while (activeDays.has(dateKey(cursor))) {
    current += 1;
    cursor = previousDay(cursor);
  }

  return { current, longest };
}
