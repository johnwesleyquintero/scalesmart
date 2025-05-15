export enum ModuleType {
  VIDEO = 'video',
  ARTICLE = 'article',
  QUIZ = 'quiz',
}

export type Course = {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  progress: number;
  modules: Module[];
  locked: boolean;
  category: 'PPC' | 'SEO' | 'Strategy';
};

export type Module = {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  type: ModuleType;
  contentSlug?: string;
  link?: string;
};
