export type Difficulty = "Easy" | "Medium" | "Hard";

export type Rating = "again" | "hard" | "good";
export type HistoricalRating = Rating | "easy";

export type CodeLanguage = "typescript" | "javascript" | "python" | "cpp" | "java";

export interface CodeDraft {
  language: CodeLanguage;
  code: string;
}

export interface Question {
  id: string;
  title: string;
  topic: string;
  difficulty: Difficulty;
  url: string;
  prompt: string;
  approach: string[];
  complexity: string;
  builtIn: boolean;
  createdAt: string;
}

export interface ReviewState {
  questionId: string;
  dueAt: string;
  intervalDays: number;
  ease: number;
  repetitions: number;
  lapses: number;
  lastReviewedAt?: string;
}

export interface ReviewEvent {
  id: string;
  questionId: string;
  rating: HistoricalRating;
  reviewedAt: string;
  nextDueAt: string;
}

export interface AppData {
  questions: Question[];
  reviews: Record<string, ReviewState>;
  history: ReviewEvent[];
  drafts: Record<string, CodeDraft>;
  activePlanId: string;
}

export interface StudyPlan {
  id: string;
  name: string;
  sourceUrl?: string;
  questionUrls?: string[];
  custom?: boolean;
}
