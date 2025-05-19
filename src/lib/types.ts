// src/lib/types.ts
export enum ModuleType {
  VIDEO = 'video',
  ARTICLE = 'article',
  QUIZ = 'quiz',
}

export interface Module {
  id: string;
  title: string;
  type: ModuleType;
  duration: string;
  link?: string;
  completed: boolean;
  videoUrl?: string;
}

export interface QuizResult {
  courseId: string;
  moduleId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  timestamp: string;
}
