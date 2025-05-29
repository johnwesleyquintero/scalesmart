import { NextResponse } from 'next/server';
import { Course, Module, ModuleType } from '@/types';
import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import {
  CATEGORY_PROGRAMMING,
  CATEGORY_FRONTEND,
  CATEGORY_COMPUTER_SCIENCE,
  CATEGORY_DIGITAL_MARKETING,
  CATEGORY_AMAZON_FBA,
  LEVEL_BEGINNER,
  LEVEL_INTERMEDIATE,
  LEVEL_ADVANCED,
  TEST_ARTICLE_SLUG,
  IMAGE_WEB_DEV,
  IMAGE_REACT_PATTERNS,
  IMAGE_DSA,
  IMAGE_SEO_FUNDAMENTALS,
  IMAGE_AMAZON_FBA_RESEARCH,
} from '../constants';

interface MdxFrontmatter {
  title: string;
  description: string;
  author: string;
  date: string;
  tags?: string[];
  duration?: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  category?: string;
  imageUrl?: string;
  isPublished?: boolean;
}

export async function GET() {
  const now = Date.now();

  const commonTimestamps = {
    creationTimestamp: now,
    updateTimestamp: now,
  };

  const academyContentDirectory = path.join(
    process.cwd(),
    'src',
    'app',
    'content',
    'academy',
  );

  const mdxFiles = (await fs.readdir(academyContentDirectory)).filter((file) =>
    file.endsWith('.mdx'),
  );

  const courses: Course[] = [];
  let courseIdCounter = 1;

  for (const file of mdxFiles) {
    const fullPath = path.join(academyContentDirectory, file);
    const fileContents = await fs.readFile(fullPath, 'utf8');
    const { data } = matter(fileContents);

    const frontmatter = data as MdxFrontmatter;
    const slug = file.replace(/\.mdx$/, '');

    // Default values for properties that might be missing in frontmatter
    const defaultDuration = '1 hour';
    const defaultLevel = LEVEL_BEGINNER;
    const defaultCategory = CATEGORY_PROGRAMMING; // Or a more generic default
    const defaultImageUrl = IMAGE_WEB_DEV; // Or a generic placeholder image
    const defaultIsPublished = true;
    const defaultTags: string[] = [];

    const course: Course = {
      id: `course-${courseIdCounter++}`,
      title: frontmatter.title,
      type: ModuleType.ARTICLE, // Assuming all MDX files are articles for now
      description: frontmatter.description,
      duration: frontmatter.duration || defaultDuration,
      level: frontmatter.level || defaultLevel,
      locked: false,
      progress: 0,
      modules: [
        {
          id: `module-${slug}`,
          title: frontmatter.title,
          duration: frontmatter.duration || defaultDuration,
          completed: false,
          progress: 0,
          type: ModuleType.ARTICLE,
          contentSlug: slug,
        },
      ],
      category: frontmatter.category || defaultCategory,
      imageUrl: frontmatter.imageUrl || defaultImageUrl,
      slug: slug,
      completed: false,
      isPublished: frontmatter.isPublished ?? defaultIsPublished,
      ...commonTimestamps,
      metadata: {
        tags: frontmatter.tags || defaultTags,
        category: frontmatter.category || defaultCategory,
      },
    };
    courses.push(course);
  }

  return NextResponse.json(courses);
}
