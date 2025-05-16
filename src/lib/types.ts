// src/lib/types.ts
export enum ModuleType {
  VIDEO = 'video',
  ARTICLE = 'article',
  QUIZ = 'quiz',
}

export interface Course {
  id: string;
  title: string;
  type: ModuleType;
  description: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  locked: boolean;
  progress: number;
  modules: Module[];
  category?: string; // Added category property
}

export interface Module {
  id: string;
  title: string;
  type: ModuleType;
  duration: string;
  link?: string;
  completed: boolean;
}

export interface QuizResult {
  courseId: string;
  moduleId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  timestamp: string;
}
