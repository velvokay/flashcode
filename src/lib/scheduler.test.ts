import { describe, expect, it } from "vitest";
import {
  applyRating,
  createReviewState,
  formatDueDate,
  isDue,
  migrateLegacyReviewState,
  previewSchedule,
} from "./scheduler";

const now = new Date("2026-10-09T12:00:00.000Z");

describe("scheduler", () => {
  it("starts every new question due immediately", () => {
    const state = createReviewState("question", now);
    expect(isDue(state, now)).toBe(true);
    expect(state.ease).toBe(2.5);
    expect(state.repetitions).toBe(0);
  });

  it("returns an unsolved coding problem after two days", () => {
    const state = createReviewState("question", now);
    const next = applyRating(state, "again", now);

    expect(next.dueAt).toBe("2026-10-11T12:00:00.000Z");
    expect(next.intervalDays).toBe(2);
    expect(next.repetitions).toBe(0);
    expect(next.lapses).toBe(1);
    expect(next.ease).toBeCloseTo(2.3);
  });

  it("graduates independent solves through seven and twenty-one day intervals", () => {
    const state = createReviewState("question", now);
    const preview = previewSchedule(state, "good", now);
    const first = applyRating(state, "good", now);
    const second = applyRating(first, "good", now);
    const third = applyRating(second, "good", now);

    expect(preview.label).toBe("7 days");
    expect(first.dueAt).toBe("2026-10-16T12:00:00.000Z");
    expect(first.intervalDays).toBe(7);
    expect(second.intervalDays).toBe(21);
    expect(third.intervalDays).toBe(42);
  });

  it("schedules assisted solutions sooner than independent solutions", () => {
    const state = {
      ...createReviewState("question", now),
      repetitions: 3,
      intervalDays: 21,
    };
    const helped = applyRating(state, "hard", now);
    const independent = applyRating(state, "good", now);

    expect(helped.intervalDays).toBe(13);
    expect(independent.intervalDays).toBe(42);
    expect(helped.ease).toBeCloseTo(2.4);
  });

  it("does not graduate a question when help was needed", () => {
    const state = createReviewState("question", now);
    const helped = applyRating(state, "hard", now);
    const independent = applyRating(helped, "good", now);

    expect(helped.intervalDays).toBe(4);
    expect(helped.repetitions).toBe(0);
    expect(independent.intervalDays).toBe(7);
    expect(independent.repetitions).toBe(1);
  });

  it("migrates legacy short intervals to the coding-problem cadence", () => {
    const failed = migrateLegacyReviewState({
      ...createReviewState("failed", now),
      repetitions: 0,
      intervalDays: 0,
      lastReviewedAt: now.toISOString(),
      dueAt: "2026-10-09T12:08:00.000Z",
    });
    const helped = migrateLegacyReviewState({
      ...createReviewState("helped", now),
      repetitions: 0,
      intervalDays: 1,
      lastReviewedAt: now.toISOString(),
      dueAt: "2026-10-10T12:00:00.000Z",
    });
    const first = migrateLegacyReviewState({
      ...createReviewState("question", now),
      repetitions: 1,
      intervalDays: 4,
      lastReviewedAt: now.toISOString(),
      dueAt: "2026-10-13T12:00:00.000Z",
    });
    const second = migrateLegacyReviewState({
      ...first,
      repetitions: 2,
      intervalDays: 10,
      dueAt: "2026-10-19T12:00:00.000Z",
    });

    expect(failed.intervalDays).toBe(2);
    expect(failed.dueAt).toBe("2026-10-11T12:00:00.000Z");
    expect(helped.intervalDays).toBe(4);
    expect(helped.dueAt).toBe("2026-10-13T12:00:00.000Z");
    expect(first.intervalDays).toBe(7);
    expect(first.dueAt).toBe("2026-10-16T12:00:00.000Z");
    expect(second.intervalDays).toBe(21);
    expect(second.dueAt).toBe("2026-10-30T12:00:00.000Z");
  });

  it("uses clear relative due labels", () => {
    expect(formatDueDate("2026-10-09T12:00:00.000Z", now)).toBe("Due now");
    expect(formatDueDate("2026-10-09T12:08:00.000Z", now)).toBe("In 8 min");
    expect(formatDueDate("2026-10-10T12:00:00.000Z", now)).toBe("Tomorrow");
  });
});
