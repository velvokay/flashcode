import { describe, expect, it } from "vitest";
import { seedQuestions } from "./questions";
import { getQuestionsForPlan, studyPlans } from "./studyPlans";

describe("study plans", () => {
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
});
