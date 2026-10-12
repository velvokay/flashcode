import type { StudySession, StudySessionKind } from "../types";

export const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function createStudySession(
  questionIds: string[],
  planId: string,
  kind: StudySessionKind,
  now = new Date(),
  category?: string,
): StudySession {
  return {
    questionIds: [...questionIds],
    currentIndex: 0,
    planId,
    kind,
    category: kind === "category" ? category : undefined,
    startedAt: now.toISOString(),
  };
}

export function normalizeStudySession(
  value: unknown,
  validQuestionIds: Set<string>,
  validPlanIds: Set<string>,
  now = new Date(),
): StudySession | null {
  if (!value || typeof value !== "object") return null;

  const session = value as Partial<StudySession>;
  const startedAt = typeof session.startedAt === "string" ? new Date(session.startedAt) : null;
  const hasValidShape =
    Array.isArray(session.questionIds) &&
    session.questionIds.length > 0 &&
    session.questionIds.every((id) => typeof id === "string" && validQuestionIds.has(id)) &&
    Number.isInteger(session.currentIndex) &&
    Number(session.currentIndex) >= 0 &&
    Number(session.currentIndex) < session.questionIds.length &&
    typeof session.planId === "string" &&
    validPlanIds.has(session.planId) &&
    (session.kind === "general" || session.kind === "category") &&
    startedAt !== null &&
    !Number.isNaN(startedAt.getTime());

  if (!hasValidShape || !startedAt) return null;
  if (now.getTime() - startedAt.getTime() >= SESSION_MAX_AGE_MS) return null;

  return {
    questionIds: [...session.questionIds!],
    currentIndex: Number(session.currentIndex),
    planId: session.planId!,
    kind: session.kind!,
    category: session.kind === "category" && typeof session.category === "string"
      ? session.category
      : undefined,
    startedAt: session.startedAt!,
  };
}
