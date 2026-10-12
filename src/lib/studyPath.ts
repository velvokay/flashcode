import type { Question, ReviewState } from "../types";
import { isDue } from "./scheduler";
import { CATEGORY_LEVELS } from "./roadmap";

const CATEGORY_ORDER: readonly string[] = CATEGORY_LEVELS.flat();

export interface CategoryProgress {
  name: string;
  total: number;
  studied: number;
  current: number;
  due: number;
  newCount: number;
  available: number;
}

export function isStudied(state: ReviewState | undefined): boolean {
  return Boolean(state?.lastReviewedAt);
}

export function orderedCategories(questions: Question[]): string[] {
  const present = new Set(questions.map((question) => question.topic));
  const known = CATEGORY_ORDER.filter((category) => present.delete(category));
  return [...known, ...Array.from(present).sort((a, b) => a.localeCompare(b))];
}

export function getCategoryProgress(
  questions: Question[],
  reviews: Record<string, ReviewState>,
  now = new Date(),
): CategoryProgress[] {
  return orderedCategories(questions).map((name) => {
    const categoryQuestions = questions.filter((question) => question.topic === name);
    const studied = categoryQuestions.filter((question) => isStudied(reviews[question.id])).length;
    const due = categoryQuestions.filter((question) => {
      const state = reviews[question.id];
      return isStudied(state) && isDue(state, now);
    }).length;
    const newCount = categoryQuestions.length - studied;

    return {
      name,
      total: categoryQuestions.length,
      studied,
      current: studied - due,
      due,
      newCount,
      available: due + newCount,
    };
  });
}

export function getCurrentCategory(
  questions: Question[],
  reviews: Record<string, ReviewState>,
  now = new Date(),
): string | null {
  const progress = getCategoryProgress(questions, reviews, now);
  return (
    progress.find((category) => category.newCount > 0)?.name ??
    progress.find((category) => category.due > 0)?.name ??
    null
  );
}

function byDueDate(
  left: Question,
  right: Question,
  reviews: Record<string, ReviewState>,
): number {
  return new Date(reviews[left.id].dueAt).getTime() - new Date(reviews[right.id].dueAt).getTime();
}

export function buildStudyQueue(
  questions: Question[],
  reviews: Record<string, ReviewState>,
  now = new Date(),
  limit = 10,
): Question[] {
  const dueReviews = questions
    .filter((question) => {
      const state = reviews[question.id];
      return isStudied(state) && isDue(state, now);
    })
    .sort((left, right) => byDueDate(left, right, reviews));

  if (dueReviews.length >= limit) return dueReviews.slice(0, limit);

  const currentCategory = getCurrentCategory(questions, reviews, now);
  const newQuestions = currentCategory
    ? questions.filter(
        (question) => question.topic === currentCategory && !isStudied(reviews[question.id]),
      )
    : [];

  return [...dueReviews, ...newQuestions.slice(0, limit - dueReviews.length)];
}

export function buildCategoryQueue(
  questions: Question[],
  reviews: Record<string, ReviewState>,
  category: string,
  now = new Date(),
  limit = 10,
): Question[] {
  const categoryQuestions = questions.filter((question) => question.topic === category);
  const dueReviews = categoryQuestions
    .filter((question) => {
      const state = reviews[question.id];
      return isStudied(state) && isDue(state, now);
    })
    .sort((left, right) => byDueDate(left, right, reviews));
  const newQuestions = categoryQuestions.filter(
    (question) => !isStudied(reviews[question.id]),
  );

  return [...dueReviews, ...newQuestions].slice(0, limit);
}

export function getQueueCounts(
  questions: Question[],
  reviews: Record<string, ReviewState>,
): { reviews: number; newCount: number } {
  const reviewsCount = questions.filter((question) => isStudied(reviews[question.id])).length;
  return { reviews: reviewsCount, newCount: questions.length - reviewsCount };
}
