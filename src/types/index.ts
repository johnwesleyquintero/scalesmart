/**
 * @typedef {object} AppEvent
 * @property {string} category - The category of the event (e.g., 'Video Player', 'Navigation').
 * @property {string} action - The action performed (e.g., 'play', 'pause', 'click').
 * @property {string} label - A label for the event, providing more context (e.g., 'Module 1 - Introduction').
 * @property {number} [value] - An optional numeric value associated with the event (e.g., duration played, score).
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
 * @typedef {object} BlogPost
 * @property {string} id - Unique identifier for the blog post.
 * @property {string} slug - Slug for the blog post, used in URLs.
 * @property {string} title - Title of the blog post.
 * @property {string} description - A brief description or excerpt of the blog post.
 * @property {string} date - Publication date of the blog post.
 * @property {string} [image] - Optional URL for the blog post's featured image.
 * @property {string[]} [tags] - Optional array of tags associated with the blog post.
 * @property {string} [readingTime] - Optional estimated reading time of the blog post.
 * @property {string} [author] - Optional author of the blog post.
 * @property {string} [content] - Optional full content of the blog post.
 * @property {unknown[]} [relatedPosts] - Optional array of related posts.
 * @property {'blog'|'article'|'case-study'} [type] - Type of the blog post (e.g., 'blog', 'article', 'case-study').
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
  relatedPosts?: BlogPost[];
  /** Type of the blog post (e.g., 'blog', 'article', 'case-study'). */
  type?: 'blog' | 'article' | 'case-study';
};

/**
 * @typedef {object} DocPost
 * @property {string} id - Unique identifier for the documentation or academy post.
 * @property {string} slug - Slug for the documentation or academy post, used in URLs.
 * @property {string} title - Title of the documentation or academy post.
 * @property {string} description - A brief description or excerpt of the documentation or academy post.
 * @property {string} date - Publication date of the documentation or academy post.
 * @property {string} [image] - Optional URL for the documentation or academy post's featured image.
 * @property {string[]} [tags] - Optional array of tags associated with the documentation or academy post.
 * @property {string} [readingTime] - Optional estimated reading time of the documentation or academy post.
 * @property {string} [author] - Optional author of the documentation or academy post.
 * @property {string} [content] - Optional full content of the documentation or academy post.
 * @property {string} [last_updated] - Optional last updated date for the document.
 * @property {string} [version] - Optional version of the document.
 * @property {unknown[]} [relatedDocs] - Optional array of related documentation posts.
 * @property {unknown[]} [relatedArticles] - Optional array of related academy articles.
 * @property {'doc' | 'academy'} [type] - Type of the post.
 * @property {string} [fileName] - File name for internal processing.
 */
export type DocPost = {
  /** Unique identifier for the documentation or academy post. */
  id: string;
  /** Slug for the documentation or academy post, used in URLs. */
  slug: string;
  /** Title of the documentation or academy post. */
  title: string;
  /** A brief description or excerpt of the documentation or academy post. */
  description: string;
  /** Publication date of the documentation or academy post. */
  date: string;
  /** Optional URL for the documentation or academy post's featured image. */
  image?: string;
  /** Optional array of tags associated with the documentation or academy post. */
  tags?: string[];
  /** Optional estimated reading time of the documentation or academy post. */
  readingTime?: string;
  /** Optional author of the documentation or academy post. */
  author?: string;
  /** Optional full content of the documentation or academy post. */
  content?: string;
  /** Optional last updated date for the document. */
  last_updated?: string;
  /** Optional version of the document. */
  version?: string;
  /** Optional array of related documentation posts. */
  relatedDocs?: unknown[];
  /** Optional array of related academy articles. */
  relatedArticles?: unknown[];
  /** Type of the post. */
  type?: 'doc' | 'academy'; // Modified to include 'academy'
  /** File name for internal processing. */
  fileName?: string;
  /** Optional category of the documentation or academy post. */
  category?: string;
  /** Optional order for sorting documentation or academy posts. */
  order?: number;
};

/**
 * @typedef {object} DocsJsonData
 * @property {DocPost[]} docs - An array of documentation posts.
 */
export interface DocsJsonData {
  /** An array of documentation posts. */
  docs: DocPost[];
}

/**
 * @typedef {object} AcademyJsonData
 * @property {DocPost[]} academy - An array of academy articles.
 */
export interface AcademyJsonData {
  /** An array of academy articles. */
  academy: DocPost[];
}

/**
 * @typedef {object} Question
 * @property {number} id - Unique identifier for the question.
 * @property {string} text - The text of the question.
 * @property {string[]} options - An array of possible answer options.
 * @property {number} correctAnswer - The correct answer to the question (index of the correct option).
 * @property {string} explanation - An explanation for the correct answer.
 */
export interface Question {
  /** Unique identifier for the question. */
  id: number;
  /** The text of the question. */
  text: string;
  /** An array of possible answer options. */
  options: string[];
  /** The correct answer to the question (index of the correct option). */
  correctAnswer: number;
  /** An explanation for the correct answer. */
  explanation: string;
}

export interface Experience {
  title: string;
  company: string;
  period: string;
  description: string;
  achievements: string[];
  startDate: string;
  endDate: string | null;
}
