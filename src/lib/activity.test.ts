import { describe, expect, it } from "vitest";
import type { ReviewEvent } from "../types";
import { getDailyReviewCounts, getStreaks } from "./activity";

function event(day: number, suffix: string): ReviewEvent {
  const reviewedAt = new Date(2026, 9, day, 12).toISOString();
  return {
    id: `${day}-${suffix}`,
    questionId: suffix,
    rating: "good",
    reviewedAt,
    nextDueAt: reviewedAt,
  };
}

describe("study activity", () => {
  it("counts reviews by local calendar day", () => {
    const counts = getDailyReviewCounts([event(8, "a"), event(8, "b"), event(9, "c")]);
    expect(Array.from(counts.values())).toEqual([2, 1]);
  });

  it("calculates current and longest streaks", () => {
    const history = [event(2, "a"), event(3, "b"), event(7, "c"), event(8, "d"), event(9, "e")];
    expect(getStreaks(history, new Date(2026, 9, 10, 10))).toEqual({ current: 3, longest: 3 });
  });

  it("keeps an active streak through the end of the next day", () => {
    expect(getStreaks([event(8, "a"), event(9, "b")], new Date(2026, 9, 10, 18))).toEqual({
      current: 2,
      longest: 2,
    });
  });
});
