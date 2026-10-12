import planData from "../data/plans/studyPlans.json";
import type { Question, StudyPlan } from "../types";

export const DEFAULT_PLAN_ID = planData.defaultPlanId;

export const studyPlans: StudyPlan[] = planData.plans.map((plan) => ({
  ...plan,
  questionIds: "questionIds" in plan ? plan.questionIds : undefined,
  custom: "custom" in plan ? plan.custom : undefined,
}));

export function getStudyPlan(planId: string): StudyPlan {
  return studyPlans.find((plan) => plan.id === planId) ?? studyPlans.find((plan) => plan.id === DEFAULT_PLAN_ID)!;
}

export function getQuestionsForPlan(planId: string, questions: Question[]): Question[] {
  const plan = getStudyPlan(planId);
  if (plan.custom) return questions.filter((question) => !question.builtIn);
  const ids = new Set(plan.questionIds);
  return questions.filter((question) => ids.has(question.id));
}
