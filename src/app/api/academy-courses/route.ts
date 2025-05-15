import courses from '@/data/portfolio-data/courses.json'; // Assuming the course data is in this file
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(courses);
}
