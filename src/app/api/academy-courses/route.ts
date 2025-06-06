import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { z } from 'zod';
import {
  CourseDataSchema,
  CourseMetadata,
  CourseMetadataSchema,
} from '@/lib/validation/course-schemas';
import { generateSlug } from '@/lib/utils';
import { handleApiError, createErrorResponse } from '@/lib/api-error-handler';

const contentDirectory = path.join(process.cwd(), 'src/app/content/academy');

/**
 * Helper function to build MDX content with YAML frontmatter.
 * Correctly serializes arrays (tags) and booleans (interactive).
 */
function buildMdxContent(data: CourseMetadata, content: string): string {
  const tagsYaml =
    data.tags && data.tags.length > 0
      ? `\n${data.tags.map((tag) => `  - ${tag}`).join('\n')}`
      : '[]';

  const interactiveYaml =
    typeof data.interactive === 'boolean'
      ? data.interactive.toString()
      : 'false';

  return `---
title: ${data.title}
description: ${data.description}
duration: ${data.duration || ''}
level: ${data.level || ''}
category: ${data.category || ''}
tags: ${tagsYaml}
author: ${data.author || ''}
interactive: ${interactiveYaml}
---

${content || ''}
`;
}

async function getCourses() {
  try {
    const fileNames = (await fs.readdir(contentDirectory)).filter(
      (fileName) => fileName.endsWith('.mdx') && fileName !== 'metadata.json',
    );

    const courses = await Promise.all(
      fileNames.map(async (fileName) => {
        try {
          const fullPath = path.join(contentDirectory, fileName);
          const fileContents = await fs.readFile(fullPath, 'utf8');

          const matterResult = matter(fileContents);
          const { data, content } = matterResult;

          const metadata = CourseMetadataSchema.parse({
            title: data.title || fileName.replace(/\.mdx$/, ''),
            description: data.description || '',
            duration: data.duration || '',
            level: data.level || '',
            category: data.category || '',
            tags: data.tags || [],
            author: data.author || '',
            interactive: data.interactive || false,
          });

          return {
            slug: fileName.replace(/\.mdx$/, ''),
            metadata,
            content,
          };
        } catch (_error: unknown) {
          // Log the error for debugging, but do not expose internal error details to the client.
          // In a production environment, consider using a dedicated logging service.
          // console.error(`Error processing file ${fileName}:`, _error);
          return null;
        }
      }),
    );
    return courses.filter((course) => course !== null);
  } catch (_error: unknown) {
    // Log the error for debugging, but do not expose internal error details to the client.
    // In a production environment, consider using a dedicated logging service.
    // console.error('Error reading content directory:', _error);
    return [];
  }
}

export async function GET() {
  const courses = await getCourses();
  return new NextResponse(JSON.stringify(courses), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = CourseDataSchema.parse(body);

    const slug = generateSlug(validatedData.title);
    const fileName = `${slug}.mdx`;
    const filePath = path.join(contentDirectory, fileName);

    const mdxContent = buildMdxContent(
      validatedData,
      validatedData.content || '',
    );

    await fs.writeFile(filePath, mdxContent);

    return NextResponse.json(
      { message: 'Course created successfully', slug: slug },
      { status: 201 },
    );
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createErrorResponse('Validation Error', JSON.stringify(error.errors)),
        { status: 400 },
      );
    }
    // Log the error for debugging, but do not expose internal error details to the client.
    // In a production environment, consider using a dedicated logging service.
    // console.error('Error in POST /api/academy-courses:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
