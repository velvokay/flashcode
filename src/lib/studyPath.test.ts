import { describe, expect, it } from "vitest";
import type { Question, ReviewState } from "../types";
import { createReviewState } from "./scheduler";
import {
  buildCategoryQueue,
  buildStudyQueue,
  getCategoryProgress,
  getCurrentCategory,
} from "./studyPath";
import { ROADMAP_EDGES, ROADMAP_POSITIONS } from "./roadmap";

const now = new Date("2026-10-09T12:00:00.000Z");

function question(id: string, topic: string): Question {
  return {
    id,
    title: id,
    topic,
    difficulty: "Easy",
    url: `https://leetcode.com/problems/${id}/`,
    prompt: id,
    approach: [],
    complexity: "",
    builtIn: true,
    createdAt: "2026-10-09T12:00:00.000Z",
  };
}

function studiedState(id: string, dueAt: string, repetitions = 1): ReviewState {
  return {
    ...createReviewState(id, now),
    dueAt,
    repetitions,
    lastReviewedAt: "2026-10-08T12:00:00.000Z",
  };
}

describe("study path queues", () => {
  const questions = [
    question("array-new", "Arrays & Hashing"),
    question("stack-new", "Stack"),
    question("linked-new", "Linked List"),
  ];

  it("introduces new questions from only the first unfinished category", () => {
    const reviews = Object.fromEntries(
      questions.map((item) => [item.id, createReviewState(item.id, now)]),
    );

    expect(buildStudyQueue(questions, reviews, now).map((item) => item.id)).toEqual([
      "array-new",
    ]);
    expect(getCurrentCategory(questions, reviews, now)).toBe("Arrays & Hashing");
  });

  it("places due reviews before new questions", () => {
    const reviews: Record<string, ReviewState> = {
      "array-new": createReviewState("array-new", now),
      "stack-new": studiedState("stack-new", "2026-10-08T11:00:00.000Z"),
      "linked-new": createReviewState("linked-new", now),
    };

    expect(buildStudyQueue(questions, reviews, now).map((item) => item.id)).toEqual([
      "stack-new",
      "array-new",
    ]);
  });

  it("keeps failed cards in studied progress even when repetitions reset", () => {
    const reviews: Record<string, ReviewState> = {
      "array-new": studiedState("array-new", "2026-10-09T11:00:00.000Z", 0),
      "stack-new": createReviewState("stack-new", now),
      "linked-new": createReviewState("linked-new", now),
    };

    expect(getCategoryProgress(questions, reviews, now)[0]).toMatchObject({
      studied: 1,
      current: 0,
      due: 1,
      newCount: 0,
    });
  });

  it("builds focused queues without leaking into another category", () => {
    const reviews = Object.fromEntries(
      questions.map((item) => [item.id, createReviewState(item.id, now)]),
    );

    expect(buildCategoryQueue(questions, reviews, "Stack", now).map((item) => item.id)).toEqual([
      "stack-new",
    ]);
  });

  it("has no current category when every category is up to date", () => {
    const reviews = Object.fromEntries(
      questions.map((item) => [
        item.id,
        studiedState(item.id, "2026-10-12T12:00:00.000Z"),
      ]),
    );

    expect(getCurrentCategory(questions, reviews, now)).toBeNull();
    expect(getCategoryProgress(questions, reviews, now).every((category) => category.current === 1)).toBe(true);
  });
});

describe("roadmap structure", () => {
  it("positions every roadmap category and connects only known categories", () => {
    const positioned = new Set(Object.keys(ROADMAP_POSITIONS));
    expect(positioned.size).toBe(18);
    for (const [from, to] of ROADMAP_EDGES) {
      expect(positioned.has(from)).toBe(true);
      expect(positioned.has(to)).toBe(true);
    }
  });

  it("keeps roadmap nodes from overlapping", () => {
    const positions = Object.entries(ROADMAP_POSITIONS);
    const nodeWidthWithGutter = 204;
    const nodeHeightWithGutter = 94;

    for (let firstIndex = 0; firstIndex < positions.length; firstIndex += 1) {
      const [firstName, first] = positions[firstIndex];

      for (let secondIndex = firstIndex + 1; secondIndex < positions.length; secondIndex += 1) {
        const [secondName, second] = positions[secondIndex];
        const overlapsHorizontally = Math.abs(first.x - second.x) < nodeWidthWithGutter;
        const overlapsVertically = Math.abs(first.y - second.y) < nodeHeightWithGutter;

        expect(overlapsHorizontally && overlapsVertically, `${firstName} overlaps ${secondName}`).toBe(false);
      }
    }
  });
});
