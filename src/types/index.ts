export enum ModuleType {
  VIDEO = 'VIDEO',
  ARTICLE = 'ARTICLE',
  QUIZ = 'QUIZ',
  EXERCISE = 'EXERCISE',
  CASE_STUDY = 'CASE_STUDY',
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
};

export type Module = {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  type: ModuleType;
  contentSlug?: string;
  link?: string;
  videoUrl?: string;
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
};
