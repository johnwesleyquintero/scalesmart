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
import { CheckCircle } from 'lucide-react'; // Import CheckCircle icon

const moduleItemStyle = 'text-gray-700 dark:text-gray-200';

interface ClientCourseListProps {
  courses: Course[];
  completedCourseIds: string[]; // Add this prop
}

export default function ClientCourseList({
  courses,
  completedCourseIds,
}: ClientCourseListProps) {
  const context = useContext<AcademyContextType | undefined>(AcademyContext);

  const handleStartCourseClick = (course: Course) => {
    context?.startCourseAction(course);
  };

  if (courses.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-10">
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
          const isCompleted = completedCourseIds.includes(course.id); // Check if course is completed
          return (
            <Card
              key={course.id || course.slug} // Prefer course.id if available and unique, otherwise slug.
              className={` ${
                course.locked
                  ? 'opacity-75 bg-gray-100 dark:bg-gray-700'
                  : 'bg-white dark:bg-gray-800'
              } border ${
                isCompleted
                  ? 'border-green-500 ring-2 ring-green-500' // Green border for completed courses
                  : 'border-gray-200 dark:border-gray-700'
              } shadow-md premium-shadow hover:shadow-lg transition-shadow duration-300 flex flex-col`}
            >
              <CardHeader className="flex-grow">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-gray-900 dark:text-gray-100">
                      {course.title}
                      {isCompleted && (
                        <CheckCircle className="ml-2 inline-block h-5 w-5 text-green-500" /> // Checkmark icon
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1 text-gray-600 dark:text-gray-400">
                      {course.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <div className="p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="flex items-center text-gray-700 dark:text-gray-200">
                    {course.duration}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${moduleItemStyle} ${
                      course.level === 'Beginner'
                        ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100'
                        : course.level === 'Intermediate'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100'
                          : course.level === 'Advanced'
                            ? 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100'
                            : ''
                    }`}
                  >
                    {course.level}
                  </span>
                </div>
                <progress
                  className="w-full h-2 rounded-full [&::-webkit-progress-bar]:bg-gray-200 [&::-webkit-progress-value]:bg-blue-500 dark:[&::-webkit-progress-bar]:bg-gray-600 dark:[&::-webkit-progress-value]:bg-blue-700"
                  value={course.progress || 0}
                  max="100"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Progress:{' '}
                  {course.progress !== undefined ? course.progress : 0}%
                </p>
              </div>
              <CardFooter>
                <Button
                  onClick={() => handleStartCourseClick(course)}
                  disabled={course.locked || !context?.startCourseAction}
                  className="w-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] text-white dark:bg-[hsl(var(--primary))] dark:hover:bg-[hsl(var(--primary))]"
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
              className="p-4 border border-red-500 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              Error loading this course.
            </div>
          ); // Fallback UI for a single broken card
        }
      })}
    </div>
  );
}
