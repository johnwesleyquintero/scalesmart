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
const CACHE_CONTROL_HEADER = 's-maxage=3600, stale-while-revalidate';
const NOT_FOUND_MESSAGE = 'Course not found';

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

async function getCourseBySlug(slug: string) {
  try {
    const fileName = `${slug}.mdx`;
    const filePath = path.join(contentDirectory, fileName);
    await fs.access(filePath); // Check if file exists

    const fileContents = await fs.readFile(filePath, 'utf8');
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
    // console.error(`Error fetching course by slug ${slug}:`, _error);
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const { slug } = params;
    const course = await getCourseBySlug(slug);
    if (!course) {
      return NextResponse.json(createErrorResponse(NOT_FOUND_MESSAGE), {
        status: 404,
      });
    }

    return new NextResponse(JSON.stringify(course), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': CACHE_CONTROL_HEADER,
      },
    });
  } catch (_error: unknown) {
    // Log the error for debugging, but do not expose internal error details to the client.
    // In a production environment, consider using a dedicated logging service.
    // console.error('Error in GET /api/academy-courses/[slug]:', _error);
    return NextResponse.json(handleApiError(_error), { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const { slug } = params;
    const body = await req.json();
    const validatedData = CourseDataSchema.parse(body);

    // The slug from the URL is the identifier for the course to update
    const oldFileName = `${slug}.mdx`;
    const oldFilePath = path.join(contentDirectory, oldFileName);

    // Generate new slug from the new title, if title is changed
    const newSlug = generateSlug(validatedData.title);
    const newFileName = `${newSlug}.mdx`;
    const newFilePath = path.join(contentDirectory, newFileName);

    // Check if the original course file exists
    try {
      await fs.access(oldFilePath);
    } catch (_error) {
      return NextResponse.json(createErrorResponse(NOT_FOUND_MESSAGE), {
        status: 404,
      });
    }

    // If the slug (title) has changed, rename the file
    if (slug !== newSlug) {
      try {
        await fs.rename(oldFilePath, newFilePath);
      } catch (_error: unknown) {
        // Log the error for debugging, but do not expose internal error details to the client.
        // In a production environment, consider using a dedicated logging service.
        // console.error(`Error renaming file from ${oldFileName} to ${newFileName}:`, _error);
        return NextResponse.json(
          createErrorResponse('Failed to rename course file'),
          { status: 500 },
        );
      }
    }

    const mdxContent = buildMdxContent(
      validatedData,
      validatedData.content || '',
    );

    // Write the updated content to the (potentially new) file path
    await fs.writeFile(newFilePath, mdxContent);

    return NextResponse.json(
      { message: 'Course updated successfully', slug: newSlug },
      { status: 200 },
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
    // console.error('Error in PUT /api/academy-courses/[slug]:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const { slug } = params;

    if (!slug) {
      return NextResponse.json(createErrorResponse('Slug is required'), {
        status: 400,
      });
    }

    const fileName = `${slug}.mdx`;
    const filePath = path.join(contentDirectory, fileName);

    // Check if the course exists
    try {
      await fs.access(filePath);
    } catch (_error) {
      return NextResponse.json(createErrorResponse(NOT_FOUND_MESSAGE), {
        status: 404,
      });
    }

    await fs.unlink(filePath);

    return NextResponse.json(
      { message: 'Course deleted successfully', slug: slug },
      { status: 200 },
    );
  } catch (error: unknown) {
    // Log the error for debugging, but do not expose internal error details to the client.
    // In a production environment, consider using a dedicated logging service.
    // console.error('Error in DELETE /api/academy-courses/[slug]:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
