export type Difficulty = "Easy" | "Medium" | "Hard";

export type Rating = "again" | "hard" | "good" | "easy";

export interface Question {
  id: string;
  code: string;
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
  rating: Rating;
  reviewedAt: string;
  nextDueAt: string;
}

export interface AppData {
  questions: Question[];
  reviews: Record<string, ReviewState>;
  history: ReviewEvent[];
}
