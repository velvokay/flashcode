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

export type StudySessionKind = "general" | "category";

export interface StudySession {
  questionIds: string[];
  currentIndex: number;
  planId: string;
  kind: StudySessionKind;
  category?: string;
  startedAt: string;
}

export interface CompletedStudySession {
  id: string;
  planId: string;
  kind: StudySessionKind;
  category?: string;
  questionCount: number;
  completedAt: string;
}

export interface AppData {
  questions: Question[];
  reviews: Record<string, ReviewState>;
  history: ReviewEvent[];
  drafts: Record<string, CodeDraft>;
  activePlanId: string;
  activeSession: StudySession | null;
  completedSessions: CompletedStudySession[];
}

export interface StudyPlan {
  id: string;
  name: string;
  sourceUrl?: string;
  questionIds?: string[];
  custom?: boolean;
}
