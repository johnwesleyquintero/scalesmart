'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Course } from '@/types';
import { useContext } from 'react';
import { AcademyContext, AcademyContextType } from '@/context/AcademyContext';

const moduleItemStyle = 'text-gray-700';

interface ClientCourseListProps {
  courses: Course[];
}

export default function ClientCourseList({ courses }: ClientCourseListProps) {
  const context = useContext<AcademyContextType | undefined>(AcademyContext);

  const handleStartCourseClick = (course: Course) => {
    context?.startCourseAction(course);
  };

  if (courses.length === 0) {
    return (
      <div className="text-center text-gray-500 py-10">
        No courses match your current filter.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
      {courses.map((course) => {
        // The try-catch here is a safeguard for individual card rendering errors.
        // Ideally, data integrity should be ensured upstream.
        try {
          return (
            <Card
              key={course.id || course.slug} // Prefer course.id if available and unique, otherwise slug.
              className={` ${
                course.locked ? 'opacity-75 bg-gray-100' : ''
              } border border-gray-200 shadow-md premium-shadow hover:shadow-lg transition-shadow duration-300 flex flex-col`}
            >
              <CardHeader className="flex-grow">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{course.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {course.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <div className="p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="flex items-center">{course.duration}</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${moduleItemStyle}`}
                  >
                    {course.level}
                  </span>
                </div>
                <progress
                  className="w-full h-2 rounded-full"
                  value={course.progress || 0}
                  max="100"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Progress:{' '}
                  {course.progress !== undefined ? course.progress : 0}%
                </p>
              </div>
              <CardFooter>
                <Button
                  onClick={() => handleStartCourseClick(course)}
                  disabled={course.locked || !context?.startCourseAction}
                  className="w-full"
                  aria-label={course.locked ? 'Coming Soon' : 'Start Course'}
                >
                  {course.locked ? 'Coming Soon' : 'Start Course'}
                </Button>
              </CardFooter>
            </Card>
          );
        } catch (error) {
          console.error('Error rendering course card:', course.title, error);
          return (
            <div
              key={course.id || course.slug}
              className="p-4 border border-red-500 rounded"
            >
              Error loading this course.
            </div>
          ); // Fallback UI for a single broken card
        }
      })}
    </div>
  );
}
