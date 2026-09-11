import { Course } from '@/types/academy';
import { coursesData } from './courses';

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  return coursesData.find((c) => c.slug === slug) || null;
}

export async function getAllCourses(): Promise<Course[]> {
  return coursesData;
}
