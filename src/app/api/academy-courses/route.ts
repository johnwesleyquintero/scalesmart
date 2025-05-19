import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Module } from '@/types';

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

async function getCourses() {
 const fileNames = fs
    .readdirSync(contentDirectory)
    .filter((fileName) => fileName.endsWith('.mdx') && fileName !== 'metadata.json');
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

const UNEXPECTED_ERROR_MESSAGE = 'An unexpected error occurred';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    validateCourseData(body);
    // TODO: Save the new course data
    return NextResponse.json(
      { message: 'Course created successfully' },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    } else {
      return NextResponse.json(
        { message: UNEXPECTED_ERROR_MESSAGE },
        { status: 500 },
      );
    }
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    validateCourseData(body);
    // TODO: Update the course data
    return NextResponse.json(
      { message: 'Course updated successfully' },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    } else {
      return NextResponse.json(
        { message: UNEXPECTED_ERROR_MESSAGE },
        { status: 500 },
      );
    }
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    validateCourseData(body);
    // TODO: Delete the course data
    return NextResponse.json(
      { message: 'Course deleted successfully' },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    } else {
      return NextResponse.json(
        { message: UNEXPECTED_ERROR_MESSAGE },
        { status: 500 },
      );
    }
  }
}
