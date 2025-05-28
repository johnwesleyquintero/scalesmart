import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Module } from '@/types';
import { generateSlug } from '@/lib/utils';
import { handleApiError, createErrorResponse } from '@/lib/api-error-handler';

const contentDirectory = path.join(process.cwd(), 'src/app/content/academy');

interface CourseData {
  title: string;
  description: string;
  modules: Module[];
}

function validateCourseData(data: CourseData) {
  if (!data.title) {
    throw new Error('Title is required');
  }
  if (!data.description) {
    throw new Error('Description is required');
  }
  if (!data.modules || !Array.isArray(data.modules)) {
    throw new Error('Modules must be an array');
  }
  return true;
}

async function getCourses(slug?: string) {
  const fileNames = fs
    .readdirSync(contentDirectory)
    .filter(
      (fileName) =>
        fileName.endsWith('.mdx') &&
        fileName !== 'metadata.json' &&
        (!slug || fileName === `${slug}.mdx`),
    );
  const courses = fileNames.map((fileName) => {
    try {
      const fullPath = path.join(contentDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');

      // Use gray-matter to parse the MDX content and metadata
      const matterResult = matter(fileContents);
      const { data, content } = matterResult;

      // Standardize metadata
      const metadata = {
        title: data.title || fileName.replace(/\.mdx$/, ''),
        description: data.description || '',
        duration: data.duration || '',
        level: data.level || '',
        category: data.category || '',
        tags: data.tags || [],
        author: data.author || '',
        interactive: data.interactive || false,
      };

      return {
        slug: fileName.replace(/\.mdx$/, ''),
        metadata,
        content,
      };
    } catch (error) {
      console.error(`Error processing file ${fileName}:`, error);
      return null; // Return null for files that cause errors
    }
  });
  return courses.filter((course) => course !== null); // Filter out null values
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
    validateCourseData(body);

    const slug = generateSlug(body.title);
    const fileName = `${slug}.mdx`;
    const filePath = path.join(contentDirectory, fileName);

    // Create the MDX content
    const mdxContent = `---
title: ${body.title}
description: ${body.description}
duration: ${body.duration || ''}
level: ${body.level || ''}
category: ${body.category || ''}
tags: ${body.tags || []}
author: ${body.author || ''}
interactive: ${body.interactive || false}
---

${body.content || ''}
`;

    // Write the MDX file
    fs.writeFileSync(filePath, mdxContent);

    return NextResponse.json(
      { message: 'Course created successfully', slug: slug },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(handleApiError(error), { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    validateCourseData(body);

    const slug = generateSlug(body.title);
    const fileName = `${slug}.mdx`;
    const filePath = path.join(contentDirectory, fileName);

    // Check if the course exists
    const existingCourses = await getCourses(slug);
    if (!existingCourses || existingCourses.length === 0) {
      return NextResponse.json(createErrorResponse('Course not found'), {
        status: 404,
      });
    }

    // Create the MDX content
    const mdxContent = `---
title: ${body.title}
description: ${body.description}
duration: ${body.duration || ''}
level: ${body.level || ''}
category: ${body.category || ''}
tags: ${body.tags || []}
author: ${body.author || ''}
interactive: ${body.interactive || false}
---

${body.content || ''}
`;

    // Write the MDX file
    fs.writeFileSync(filePath, mdxContent);

    return NextResponse.json(
      { message: 'Course updated successfully', slug: slug },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(handleApiError(error), { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug } = body;

    if (!slug) {
      return NextResponse.json(createErrorResponse('Slug is required'), {
        status: 400,
      });
    }

    const fileName = `${slug}.mdx`;
    const filePath = path.join(contentDirectory, fileName);

    // Check if the course exists
    const existingCourses = await getCourses(slug);
    if (!existingCourses || existingCourses.length === 0) {
      return NextResponse.json(createErrorResponse('Course not found'), {
        status: 404,
      });
    }

    // Delete the MDX file
    fs.unlinkSync(filePath);

    return NextResponse.json(
      { message: 'Course deleted successfully', slug: slug },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(handleApiError(error), { status: 400 });
  }
}
