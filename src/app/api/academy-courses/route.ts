import { NextResponse } from 'next/server';
import type { Course } from '@/types';
import path from 'path';
import { promises as fs } from 'fs';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'courses.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const courses: Course[] = JSON.parse(fileContents);
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching academy courses:', error);
    return NextResponse.json(
      { message: 'Internal Server Error while fetching courses' },
      { status: 500 },
    );
  }
}
