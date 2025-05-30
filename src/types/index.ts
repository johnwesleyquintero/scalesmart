/**
 * Defines the possible types of modules within a course.
 */
export enum ModuleType {
  /** Indicates a video module. */
  VIDEO = 'VIDEO',
  /** Indicates an article module. */
  ARTICLE = 'ARTICLE',
  /** Indicates a quiz module. */
  QUIZ = 'QUIZ',
  /** Indicates an exercise module. */
  EXERCISE = 'EXERCISE',
  /** Indicates a case study module. */
  CASE_STUDY = 'CASE_STUDY',
  /** Indicates a simulation module. */
  SIMULATION = 'SIMULATION',
}

/**
 * Represents a course in the learning platform.
 */
export type Course = {
  /** Unique identifier for the course. */
  id: string;
  /** Title of the course. */
  title: string;
  /** The type of module, can be one of the ModuleType enum values or a custom string. */
  type: ModuleType | string;
  /** A brief description of the course. */
  description: string;
  /** The total duration of the course. */
  duration: string;
  /** The difficulty level of the course. */
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  /** Indicates if the course is locked and inaccessible. */
  locked: boolean;
  /** Current progress percentage of the user in the course. */
  progress: number;
  /** An array of modules included in the course. */
  modules: Module[];
  /** Optional category of the course. */
  category?: string;
  /** Optional URL for the course's image. */
  imageUrl?: string;
  /** Optional slug for the course, used in URLs. */
  slug?: string;
  /** Indicates if the course has been completed by the user. */
  completed: boolean;
  /** Optional timestamp of the last time the course was visited. */
  lastVisited?: Date;
  /** Indicates if the course is published for admin management. */
  isPublished?: boolean;
  /** Timestamp when the course was created. */
  creationTimestamp?: number;
  /** Timestamp when the course was last updated. */
  updateTimestamp?: number;
  /** Metadata associated with the course. */
  metadata: {
    /** Tags associated with the course. */
    tags: string[];
    /** Category from metadata. */
    category: string;
  };
};

/**
 * Represents a single module within a course.
 */
export type Module = {
  /** Unique identifier for the module. */
  id: string;
  /** Title of the module. */
  title: string;
  /** Duration of the module. */
  duration: string;
  /** Indicates if the module has been completed. */
  completed: boolean;
  /** Current progress percentage of the user in the module. */
  progress: number;
  /** The type of module. */
  type: ModuleType;
  /** Optional slug for the content if it's an article. */
  contentSlug?: string;
  /** Optional link related to the module content. */
  link?: string;
  /** Optional URL for a video module. */
  videoUrl?: string;
  /** Optional identifier for an exercise. */
  exercise?: string;
  /** Optional quiz details if the module is a quiz. */
  quiz?: {
    /** Array of questions in the quiz. */
    questions: Question[];
  };
  /** Optional timestamp of the last time the module was visited. */
  lastVisited?: Date;
};

/**
 * Represents a custom application event for analytics or tracking.
 */
export type AppEvent = {
  /** The category of the event (e.g., 'Video Player', 'Navigation'). */
  category: string;
  /** The action performed (e.g., 'play', 'pause', 'click'). */
  action: string;
  /** A label for the event, providing more context (e.g., 'Module 1 - Introduction'). */
  label: string;
  /** An optional numeric value associated with the event (e.g., duration played, score). */
  value?: number;
};

/**
 * Represents a blog post.
 */
export type BlogPost = {
  /** Unique identifier for the blog post. */
  id: string;
  /** Slug for the blog post, used in URLs. */
  slug: string;
  /** Title of the blog post. */
  title: string;
  /** A brief description or excerpt of the blog post. */
  description: string;
  /** Publication date of the blog post. */
  date: string;
  /** Optional URL for the blog post's featured image. */
  image?: string;
  /** Optional array of tags associated with the blog post. */
  tags?: string[];
  /** Optional estimated reading time of the blog post. */
  readingTime?: string;
  /** Optional author of the blog post. */
  author?: string;
  /** Optional full content of the blog post. */
  content?: string;
  /** Optional array of related posts. */
  relatedPosts?: unknown[];
  /** Type of the blog post (e.g., 'blog', 'article', 'case-study'). */
  type?: 'blog' | 'article' | 'case-study';
};

/**
 * Represents a documentation post.
 */
export type DocPost = {
  /** Unique identifier for the documentation post. */
  id: string;
  /** Slug for the documentation post, used in URLs. */
  slug: string;
  /** Title of the documentation post. */
  title: string;
  /** A brief description or excerpt of the documentation post. */
  description: string;
  /** Publication date of the documentation post. */
  date: string;
  /** Optional URL for the documentation post's featured image. */
  image?: string;
  /** Optional array of tags associated with the documentation post. */
  tags?: string[];
  /** Optional estimated reading time of the documentation post. */
  readingTime?: string;
  /** Optional author of the documentation post. */
  author?: string;
  /** Optional full content of the documentation post. */
  content?: string;
  /** Optional array of related documentation posts. */
  relatedDocs?: unknown[];
  /** Type of the documentation post. */
  type?: 'doc';
  /** File name for internal processing. */
  fileName?: string;
};

/**
 * Represents a single question in a quiz.
 */
export interface Question {
  /** Unique identifier for the question. */
  id: number;
  /** The text of the question. */
  text: string;
  /** An array of possible answer options. */
  options: string[];
  /** The correct answer to the question. */
  correctAnswer: string;
  /** An explanation for the correct answer. */
  explanation: string;
}

/**
 * Represents the result of a quiz attempt.
 */
export type QuizResult = {
  /** The score obtained in the quiz. */
  score: number;
  /** The number of attempts made for this quiz. */
  attempts: number;
  /** Indicates if the quiz was passed. */
  pass: boolean;
  /** True if a certificate has been earned for this quiz. */
  certificateAwarded?: boolean;
};
