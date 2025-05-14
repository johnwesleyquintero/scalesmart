export const ARTICLE_TYPE = 'article' as const;
export const CATEGORIES = {
  PPC: 'PPC',
  SEO: 'SEO',
  STRATEGY: 'Strategy',
} as const;
export const CONTENT_SLUG_ADVANCED_SEO_TECHNIQUES =
  '10-advanced-amazon-seo-techniques-that-actually-work-in-2025';
export interface CourseDescriptions {
  FBA_FUNDAMENTALS: string;
  PPC_MASTERY: string;
  SEO_OPTIMIZATION: string;
  ADVANCED_STRATEGY: string;
}
export const COURSE_DESCRIPTIONS: CourseDescriptions = {
  FBA_FUNDAMENTALS:
    'Master the fundamentals of selling on Amazon with our comprehensive FBA course.',
  PPC_MASTERY:
    'Become an expert in Amazon PPC advertising and drive more sales to your products.',
  SEO_OPTIMIZATION:
    'Learn how to optimize your Amazon product listings for higher search rankings and increased visibility.',
  ADVANCED_STRATEGY:
    'Develop advanced strategies for maximizing your Amazon sales and profitability.',
};
export const COURSE_TITLE_ADVANCED_AMAZON_STRATEGY = 'Advanced Amazon Strategy';
export const COURSE_TITLE_AMAZON_FBA_FUNDAMENTALS = 'amazon-fba-fundamentals';
export const COURSE_TITLE_AMAZON_PPC_MASTERY = 'amazon-ppc-mastery';
export const COURSE_TITLE_AMAZON_SEO_OPTIMIZATION = 'amazon-seo-optimization';
export const COURSE_TYPE = 'course' as const;
export const GETTING_STARTED_FBA = 'blog/getting-started-fba';
export const LEVELS = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
} as const;
export const MODULE_TITLE_NAVIGATING_SELLER_CENTRAL =
  'Navigating Seller Central';
export const PRODUCT_LISTING_GUIDE = 'product-listing-guide';
export const QUIZ_TYPE = 'quiz' as const;
export type RoadmapSchema = {
  title: string;
  description: string;
  date: string;
  completed: boolean;
};
export const VIDEO_TYPE = 'video' as const;
export const YOUTUBE_SELLER_CENTRAL = 'youtube-seller-central';
export const YOUTUBE_URL = 'youtube.com/wesleyquintero';

export type Course = {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  progress: number; // This will be managed by localStorage in a future step if needed
  modules: Module[];
  locked: boolean;
  category: 'PPC' | 'SEO' | 'Strategy';
  type: 'course';
  prerequisites?: string[];
  achievements?: Achievement[];
  practicalExercises?: PracticalExercise[];
};

export type Module = {
  id: string;
  title: string;
  duration: string;
  completed: boolean; // This will be managed by localStorage in a future step if needed
  type: 'video' | 'article' | 'quiz';
  contentSlug?: string;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  criteria: string;
};

export type PracticalExercise = {
  id: string;
  title: string;
  description: string;
  link: string;
};
