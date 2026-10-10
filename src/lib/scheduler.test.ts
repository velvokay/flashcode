import { describe, expect, it } from "vitest";
import { applyRating, createReviewState, formatDueDate, isDue, previewSchedule } from "./scheduler";

const now = new Date("2026-10-09T12:00:00.000Z");

describe("scheduler", () => {
  it("starts every new question due immediately", () => {
    const state = createReviewState("question", now);
    expect(isDue(state, now)).toBe(true);
    expect(state.ease).toBe(2.5);
    expect(state.repetitions).toBe(0);
  });

  it("returns a failed question after eight minutes", () => {
    const state = createReviewState("question", now);
    const next = applyRating(state, "again", now);

    expect(next.dueAt).toBe("2026-10-09T12:08:00.000Z");
    expect(next.repetitions).toBe(0);
    expect(next.lapses).toBe(1);
    expect(next.ease).toBeCloseTo(2.3);
  });

  it("graduates a new question to two days after a good recall", () => {
    const state = createReviewState("question", now);
    const preview = previewSchedule(state, "good", now);
    const next = applyRating(state, "good", now);

    expect(preview.label).toBe("2 days");
    expect(next.dueAt).toBe("2026-10-11T12:00:00.000Z");
    expect(next.repetitions).toBe(1);
    expect(next.intervalDays).toBe(2);
  });

  it("schedules assisted solutions sooner than independent solutions", () => {
    const state = {
      ...createReviewState("question", now),
      repetitions: 3,
      intervalDays: 10,
    };
    const helped = applyRating(state, "hard", now);
    const independent = applyRating(state, "good", now);

    expect(helped.intervalDays).toBe(12);
    expect(independent.intervalDays).toBe(25);
    expect(helped.ease).toBeCloseTo(2.5);
  });

  it("uses clear relative due labels", () => {
    expect(formatDueDate("2026-10-09T12:00:00.000Z", now)).toBe("Due now");
    expect(formatDueDate("2026-10-09T12:08:00.000Z", now)).toBe("In 8 min");
    expect(formatDueDate("2026-10-10T12:00:00.000Z", now)).toBe("Tomorrow");
  });
});
