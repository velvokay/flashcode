import { describe, expect, it } from "vitest";
import {
  createCompletedStudySession,
  createStudySession,
  normalizeStudySession,
  SESSION_MAX_AGE_MS,
} from "./session";

const questionIds = new Set(["one", "two", "three"]);
const planIds = new Set(["plan"]);
const now = new Date("2026-10-11T12:00:00.000Z");

describe("study sessions", () => {
  it("creates an ordered session at the first question", () => {
    expect(createStudySession(["two", "one"], "plan", "general", now)).toEqual({
      questionIds: ["two", "one"],
      currentIndex: 0,
      planId: "plan",
      kind: "general",
      category: undefined,
      startedAt: now.toISOString(),
    });
  });

  it("preserves the exact queue and cursor", () => {
    const session = {
      ...createStudySession(["three", "one", "two"], "plan", "category", now, "Arrays"),
      currentIndex: 1,
    };

    expect(normalizeStudySession(session, questionIds, planIds, now)).toEqual(session);
  });

  it("records a completed session with its full question count", () => {
    const session = createStudySession(["one", "two"], "plan", "category", now, "Arrays");

    expect(createCompletedStudySession(session, now)).toEqual({
      id: `plan-${now.getTime()}`,
      planId: "plan",
      kind: "category",
      category: "Arrays",
      questionCount: 2,
      completedAt: now.toISOString(),
    });
  });

  it("rejects a session whose question data has changed", () => {
    const session = createStudySession(["one", "missing"], "plan", "general", now);
    expect(normalizeStudySession(session, questionIds, planIds, now)).toBeNull();
  });

  it("expires a session after 24 hours", () => {
    const session = createStudySession(["one"], "plan", "general", now);
    const later = new Date(now.getTime() + SESSION_MAX_AGE_MS);
    expect(normalizeStudySession(session, questionIds, planIds, later)).toBeNull();
  });
});
