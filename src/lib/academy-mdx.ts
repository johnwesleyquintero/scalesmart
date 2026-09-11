import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { z } from 'zod';
import { cache } from 'react';

const UTF8 = 'utf8';
const MARKDOWN_FILE_REGEX = /\.(mdx|md)$/;

/**
 * Zod schema for Academy lesson frontmatter.
 */
const lessonFrontmatterSchema = z.object({
  title: z.string(),
  lessonNumber: z.number(),
  courseSlug: z.string(),
  duration: z.string().optional().default('20 min'),
  level: z
    .enum(['Beginner', 'Intermediate', 'Advanced', 'Expert'])
    .optional()
    .default('Beginner'),
  operatorNote: z.string().optional().default(''),
  description: z.string().optional().default(''),
});

export type LessonFrontmatter = z.infer<typeof lessonFrontmatterSchema>;

export interface LessonMeta extends LessonFrontmatter {
  /** The URL slug derived from the filename (without number prefix and extension) */
  slug: string;
  /** Absolute filesystem path to the MDX file */
  filePath: string;
}

export interface LessonContent extends LessonMeta {
  /** Raw MDX content string (everything after the frontmatter block) */
  content: string;
}

/**
 * Returns the directory where Academy MDX content lives for a given course.
 */
function getCourseContentDir(courseSlug: string): string {
  return path.join(
    process.cwd(),
    'src',
    'app',
    'content',
    'academy',
    courseSlug,
  );
}

/**
 * Derives the URL slug from a lesson filename.
 * e.g. "01-how-amazon-advertising-works.mdx" → "how-amazon-advertising-works"
 */
function deriveSlug(filename: string): string {
  return filename
    .replace(MARKDOWN_FILE_REGEX, '') // strip extension
    .replace(/^\d+-/, ''); // strip leading number prefix (e.g. "01-")
}

/**
 * Reads and parses a single lesson MDX file.
 */
function parseLessonFile(
  filePath: string,
  courseSlug: string,
): LessonContent | undefined {
  try {
    const rawContent = fs.readFileSync(filePath, UTF8);
    const { data, content } = matter(rawContent);
    const frontmatter = lessonFrontmatterSchema.parse({ courseSlug, ...data });
    const slug = deriveSlug(path.basename(filePath));
    return { ...frontmatter, slug, filePath, content };
  } catch (err) {
    console.error(
      `[Academy MDX] Failed to parse lesson file: ${filePath}`,
      err,
    );
    return undefined;
  }
}

/**
 * Returns sorted lesson metadata for all lessons in a course.
 * Sorted ascending by lessonNumber.
 */
export const getCourseLessons = cache(
  async (courseSlug: string): Promise<LessonMeta[]> => {
    const dir = getCourseContentDir(courseSlug);
    if (!fs.existsSync(dir)) {
      console.warn(`[Academy MDX] Course content directory not found: ${dir}`);
      return [];
    }

    const files = fs
      .readdirSync(dir)
      .filter((f) => MARKDOWN_FILE_REGEX.test(f));

    const lessons = files
      .map((filename) => parseLessonFile(path.join(dir, filename), courseSlug))
      .filter((l): l is LessonContent => l !== undefined)
      .sort((a, b) => a.lessonNumber - b.lessonNumber);

    // Return without content (metadata only)
    return lessons.map(({ content: _content, ...meta }) => meta);
  },
);

/**
 * Returns the full MDX content + metadata for a single lesson by its URL slug.
 */
export const getLessonBySlug = cache(
  async (
    courseSlug: string,
    lessonSlug: string,
  ): Promise<LessonContent | undefined> => {
    const dir = getCourseContentDir(courseSlug);
    if (!fs.existsSync(dir)) return undefined;

    const files = fs
      .readdirSync(dir)
      .filter((f) => MARKDOWN_FILE_REGEX.test(f));

    const matchingFile = files.find(
      (filename) => deriveSlug(filename) === lessonSlug,
    );
    if (!matchingFile) {
      console.warn(
        `[Academy MDX] Lesson not found: ${courseSlug}/${lessonSlug}`,
      );
      return undefined;
    }

    return parseLessonFile(path.join(dir, matchingFile), courseSlug);
  },
);
