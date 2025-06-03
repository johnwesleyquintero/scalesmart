'use client';

import { AcademyContentClient } from '@/app/academy/components/AcademyContentClient';
import { Course } from '@/types';
import { useMemo, useCallback, useState } from 'react'; // Removed useEffect, useState
import ErrorBoundary from '@/components/ui/error-boundary';
import { AcademyProvider } from '@/context/AcademyContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getAllCourses,
  updateCourse,
  deleteCoursesByIds,
} from '@/lib/indexeddb-service';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query'; // Import useQuery

const DURATION_DESCENDING_SORT = 'Duration (descending)';
const sortOptions = ['Title', 'Duration', 'Level', DURATION_DESCENDING_SORT];

// Combined fetch and sync function for React Query
const fetchAndSyncCourses = async (): Promise<Course[]> => {
  const [indexedDBCourses, serverResponse] = await Promise.all([
    getAllCourses(),
    fetch('/api/academy/courses'),
  ]);

  if (!serverResponse.ok) {
    throw new Error(`HTTP error! status: ${serverResponse.status}`);
  }
  const serverCourses: Course[] = await serverResponse.json();

  const serverCourseIds = new Set(serverCourses.map((c) => c.id));
  const coursesToDelete = indexedDBCourses.filter(
    (c) => !serverCourseIds.has(c.id),
  );

  if (coursesToDelete.length > 0) {
    await deleteCoursesByIds(coursesToDelete.map((c) => c.id));
  }

  const updatePromises = serverCourses.map(async (serverCourse) => {
    const existingCourse = indexedDBCourses.find(
      (c) => c.id === serverCourse.id,
    );

    if (
      !existingCourse ||
      (serverCourse.updateTimestamp &&
        existingCourse.updateTimestamp &&
        new Date(serverCourse.updateTimestamp).getTime() >
          new Date(existingCourse.updateTimestamp).getTime())
    ) {
      await updateCourse(serverCourse);
    }
  });

  await Promise.all(updatePromises);

  return await getAllCourses(); // Return the updated local courses
};

export function AcademyPageContent() {
  const [activeTab, setActiveTab] = useState('All');
  const [sort, setSort] = useState('Title');
  const searchParams = useSearchParams();

  // Use useQuery for data fetching and state management
  const {
    data: courses = [], // Initialize with an empty array
    isLoading,
    isError,
    error,
  } = useQuery<Course[], Error>({
    queryKey: ['academyCourses'],
    queryFn: fetchAndSyncCourses,
    staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes
    retry: false, // Don't retry on error, handle explicitly
  });

  // categoryOptions derived from fetched courses
  const categoryOptions = useMemo(() => {
    const categories = new Set<string>();
    if (courses) {
      courses.forEach((course: Course) => {
        if (course.metadata?.category) {
          categories.add(course.metadata.category);
        }
      });
    }
    return ['All', ...Array.from(categories).sort()];
  }, [courses]);

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSort(event.target.value);
  };

  const parseDuration = useCallback(
    (durationString: string | null | undefined): number => {
      if (!durationString) return 0;
      const parts = durationString.toLowerCase().split(' ');
      let totalMinutes = 0;
      for (let i = 0; i < parts.length; i += 2) {
        const value = parseInt(parts[i]);
        const unit = parts[i + 1];
        if (isNaN(value)) continue;
        if (
          unit === 'minutes' ||
          unit === 'minute' ||
          unit === 'mins' ||
          unit === 'min'
        ) {
          totalMinutes += value;
        } else if (
          unit === 'hours' ||
          unit === 'hour' ||
          unit === 'hrs' ||
          unit === 'hr'
        ) {
          totalMinutes += value * 60;
        } else if (unit === 'days' || unit === 'day') {
          totalMinutes += value * 60 * 24;
        }
      }
      return totalMinutes;
    },
    [],
  );

  const filteredAndSortedCourses = useMemo(() => {
    let currentCourses: Course[] = courses; // `courses` is already defaulted to `[]` if no data yet

    currentCourses = currentCourses.filter((course: Course) => {
      if (activeTab === 'All') return true;
      return course.metadata?.category === activeTab;
    });

    currentCourses = currentCourses.sort((a: Course, b: Course) => {
      if (sort === 'Title') {
        return (a.title || '').localeCompare(b.title || '');
      } else if (sort === 'Level') {
        return (a.level || '').localeCompare(b.level || '');
      } else if (sort === 'Duration' || sort === 'Duration (descending)') {
        const durationA = parseDuration(a.duration);
        const durationB = parseDuration(b.duration);

        return sort === DURATION_DESCENDING_SORT
          ? durationB - durationA
          : durationA - durationB;
      }
      return 0;
    });
    return currentCourses;
  }, [courses, activeTab, sort, parseDuration]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 text-center">
        Loading courses...
      </div>
    );
  }

  if (isError) {
    // Corrected to handle error safely, assuming `error` is `unknown` by default for type inference issues
    return (
      <div className="container mx-auto p-4 text-center text-red-500">
        Error:{' '}
        {error instanceof Error
          ? error.message
          : 'Failed to load academy courses. Please try again later.'}
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col items-stretch bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      {filteredAndSortedCourses.length === 0 ? (
        <div className="flex justify-center items-center min-h-[200px] text-gray-600 dark:text-gray-300">
          No courses found for the selected category.
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 flex flex-wrap h-auto justify-center bg-gray-100 dark:bg-gray-700">
            {categoryOptions.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-white dark:data-[state=active]:bg-[hsl(var(--primary))] dark:data-[state=active]:text-white text-gray-700 dark:text-gray-200"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={activeTab} className="space-y-4 mt-4">
            <div className="flex justify-end mb-4">
              <select
                value={sort}
                onChange={handleSortChange}
                className="border rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                aria-label="Sort by"
              >
                {sortOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <AcademyProvider>
              <ErrorBoundary>
                <AcademyContentClient
                  courses={filteredAndSortedCourses}
                  initialCourseId={searchParams.get('courseId')}
                />
              </ErrorBoundary>
            </AcademyProvider>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
