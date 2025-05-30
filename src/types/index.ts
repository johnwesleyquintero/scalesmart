export enum ModuleType {
  VIDEO = 'VIDEO',
  ARTICLE = 'ARTICLE',
  QUIZ = 'QUIZ',
  EXERCISE = 'EXERCISE',
  CASE_STUDY = 'CASE_STUDY',
  SIMULATION = 'SIMULATION',
}

export type Course = {
  id: string;
  title: string;
  type: ModuleType | string;
  description: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  locked: boolean;
  progress: number;
  modules: Module[];
  category?: string; // Added category property
  imageUrl?: string;
  slug?: string;
  completed: boolean;
  lastVisited?: Date; // Track last visited course
  isPublished?: boolean; // Added for admin management
  creationTimestamp?: number; // Add creation timestamp
  updateTimestamp?: number; // Add update timestamp
  metadata: {
    tags: string[];
    category: string;
  };
};

export type Module = {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  progress: number; // Add progress to module
  type: ModuleType;
  contentSlug?: string;
  link?: string;
  videoUrl?: string;
  exercise?: string;
  quiz?: {
    questions: Question[];
  };
  lastVisited?: Date; // Track last visited module
};

export type AppEvent = {
  category: string;
  action: string;
  label: string;
  value?: number;
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  image?: string;
  tags?: string[];
  readingTime?: string;
  author?: string;
  content?: string;
  relatedPosts?: unknown[];
  type?: 'blog' | 'article' | 'case-study'; // New: Type of the blog post
};

export type DocPost = {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  image?: string;
  tags?: string[];
  readingTime?: string;
  author?: string;
  content?: string;
  relatedDocs?: unknown[];
  type?: 'doc';
};

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export type QuizResult = {
  score: number;
  attempts: number;
  pass: boolean;
  certificateAwarded?: boolean; // True if a certificate has been earned for this quiz
};
