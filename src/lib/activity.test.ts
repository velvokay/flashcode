import { describe, expect, it } from "vitest";
import type { ReviewEvent, ReviewState } from "../types";
import {
  getDailyReviewCounts,
  getReviewedQuestionIdsByDay,
  getScheduledQuestionIdsByDay,
  getStreaks,
} from "./activity";

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

  it("groups unique reviewed problems by local day", () => {
    const reviewed = getReviewedQuestionIdsByDay(
      [event(8, "a"), event(8, "a"), event(8, "b"), event(9, "c")],
      ["a", "b"],
    );

    expect(reviewed.get("2026-10-08")).toEqual(["a", "b"]);
    expect(reviewed.has("2026-10-09")).toBe(false);
  });

  it("groups studied problems by due day and carries overdue work into today", () => {
    const review = (questionId: string, dueDay: number, studied = true): ReviewState => ({
      questionId,
      dueAt: new Date(2026, 9, dueDay, 12).toISOString(),
      intervalDays: 4,
      ease: 2.5,
      repetitions: studied ? 1 : 0,
      lapses: 0,
      lastReviewedAt: studied ? new Date(2026, 9, 1, 12).toISOString() : undefined,
    });
    const scheduled = getScheduledQuestionIdsByDay(
      {
        overdue: review("overdue", 8),
        today: review("today", 10),
        future: review("future", 14),
        new: review("new", 10, false),
      },
      ["overdue", "today", "future", "new"],
      new Date(2026, 9, 10, 9),
    );

    expect(scheduled.get("2026-10-10")).toEqual(["overdue", "today"]);
    expect(scheduled.get("2026-10-14")).toEqual(["future"]);
  });
});
