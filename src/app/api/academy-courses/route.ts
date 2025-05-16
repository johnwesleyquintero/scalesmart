import { NextResponse } from 'next/server';
import type { Course } from '@/types'; // Make sure your Course type is correctly imported

// This is dummy data. Replace this with your actual data fetching logic.
const dummyCourses: Course[] = [
  {
    id: '1',
    title: 'Introduction to Amazon PPC',
    description: 'Learn the fundamentals of Amazon Pay-Per-Click advertising.',
    duration: '2 hours',
    level: 'Beginner',
    locked: false,
    modules: [], // Add modules if needed
    progress: 0,
    type: '',
  },
  {
    id: '2',
    title: 'Advanced Amazon SEO',
    description: 'Master advanced SEO techniques for Amazon listings.',
    duration: '4 hours',
    level: 'Advanced',
    locked: true,
    modules: [],
    progress: 0,
    type: '',
  },
];

export async function GET() {
  // In a real application, you would fetch data from a database or CMS here.
  // For now, we're returning the dummy data.
  try {
    // Simulate fetching data
    const courses = dummyCourses;
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching academy courses:', error);
    return NextResponse.json(
      { message: 'Internal Server Error while fetching courses' },
      { status: 500 },
    );
  }
}
