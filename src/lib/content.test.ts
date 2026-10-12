import { describe, expect, it } from "vitest";
import { seedQuestions } from "./catalog";
import { ROADMAP_POSITIONS } from "./roadmap";
import { DEFAULT_PLAN_ID, getQuestionsForPlan, studyPlans } from "./studyPlans";

describe("study plans", () => {
  it("loads a complete, uniquely identified question catalog", () => {
    expect(seedQuestions).toHaveLength(150);
    expect(new Set(seedQuestions.map((question) => question.id)).size).toBe(seedQuestions.length);

    for (const question of seedQuestions) {
      expect(question.id).not.toBe("");
      expect(question.title).not.toBe("");
      expect(question.topic).not.toBe("");
      expect(question.url).toMatch(/^https:\/\/leetcode\.com\/problems\//);
      expect(question.prompt).not.toBe("");
      expect(Array.isArray(question.approach)).toBe(true);
      expect(typeof question.complexity).toBe("string");
    }
  });

  it("ships the expected plan sizes", () => {
    expect(getQuestionsForPlan("neetcode-150", seedQuestions)).toHaveLength(150);
    expect(getQuestionsForPlan("blind-75", seedQuestions)).toHaveLength(75);
    expect(getQuestionsForPlan("starter-10", seedQuestions)).toHaveLength(10);
  });

  it("keeps each built-in plan free of duplicate questions", () => {
    for (const plan of studyPlans.filter((item) => !item.custom)) {
      const questions = getQuestionsForPlan(plan.id, seedQuestions);
      expect(new Set(questions.map((question) => question.url)).size).toBe(questions.length);
    }
  });

  it("shares question identities across overlapping plans", () => {
    const starter = getQuestionsForPlan("starter-10", seedQuestions);
    const neetcodeUrls = new Set(
      getQuestionsForPlan("neetcode-150", seedQuestions).map((question) => question.url),
    );
    expect(starter.every((question) => neetcodeUrls.has(question.url))).toBe(true);
  });

  it("references only questions in the catalog", () => {
    const catalogIds = new Set(seedQuestions.map((question) => question.id));

    for (const plan of studyPlans.filter((item) => !item.custom)) {
      expect(plan.questionIds?.every((id) => catalogIds.has(id))).toBe(true);
      expect(getQuestionsForPlan(plan.id, seedQuestions)).toHaveLength(plan.questionIds?.length ?? 0);
    }
  });

  it("defines a valid default plan and roadmap category for every built-in question", () => {
    expect(studyPlans.some((plan) => plan.id === DEFAULT_PLAN_ID)).toBe(true);

    const catalogTopics = new Set(seedQuestions.map((question) => question.topic));
    const roadmapTopics = new Set(Object.keys(ROADMAP_POSITIONS));
    expect(roadmapTopics).toEqual(catalogTopics);
  });
});
