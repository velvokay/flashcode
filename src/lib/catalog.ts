import catalogData from "../data/catalogs/neetcode150.json";
import type { Question } from "../types";

const validDifficulties = new Set<Question["difficulty"]>(["Easy", "Medium", "Hard"]);

function isQuestionRecord(value: (typeof catalogData.questions)[number]): value is (typeof catalogData.questions)[number] & {
  difficulty: Question["difficulty"];
} {
  return Boolean(
    value.id &&
    value.title &&
    value.topic &&
    value.url &&
    value.prompt &&
    Array.isArray(value.approach) &&
    typeof value.complexity === "string" &&
    validDifficulties.has(value.difficulty as Question["difficulty"]),
  );
}

export const seedQuestions: Question[] = catalogData.questions.map((question) => {
  if (!isQuestionRecord(question)) {
    throw new Error(`Invalid built-in question data: ${question.title || question.id || "unknown"}`);
  }

  return {
    ...question,
    difficulty: question.difficulty,
    builtIn: true,
    createdAt: catalogData.createdAt,
  };
});
