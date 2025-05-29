'use client';

import { AcademyContentClient } from '@/app/academy/components/AcademyContentClient';
import { Course } from '@/types';
import { useState, useMemo, useEffect, useCallback } from 'react';
import ErrorBoundary from '@/components/ui/error-boundary';
import { AcademyProvider } from '@/context/AcademyContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCoursesByIds, // Import deleteCoursesByIds
} from '@/lib/indexeddb-service';
import { useSearchParams } from 'next/navigation'; // Import useSearchParams

const DURATION_DESCENDING_SORT = 'Duration (descending)';
const sortOptions = ['Title', 'Duration', 'Level', DURATION_DESCENDING_SORT];

export function AcademyPageContent() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('All');
  const [sort, setSort] = useState('Title');
  const searchParams = useSearchParams(); // Get search params

  const fetchAndStoreCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [indexedDBCourses, serverResponse] = await Promise.all([
        getAllCourses(),
        fetch('/api/academy/courses'),
      ]);

      if (indexedDBCourses.length > 0) {
        setCourses(indexedDBCourses);
      }

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

      const updatedCourses = await getAllCourses();
      setCourses(updatedCourses);
    } catch (e) {
      setError('Failed to load academy courses. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAndStoreCourses();
  }, [fetchAndStoreCourses]);

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSort(event.target.value);
  };

  const categoryOptions = useMemo(() => {
    const categories = new Set<string>();
    courses.forEach((course) => {
      if (course.metadata?.category) {
        categories.add(course.metadata.category);
      }
    });
    return ['All', ...Array.from(categories).sort()];
  }, [courses]);

  const parseDuration = (durationString: string | undefined): number => {
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
  };

  const filteredAndSortedCourses = useMemo(() => {
    let currentCourses = courses || [];

    currentCourses = currentCourses.filter((course) => {
      if (activeTab === 'All') return true;
      return course.metadata?.category === activeTab;
    });

    currentCourses = currentCourses.sort((a, b) => {
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
      return 0; // Default return for other sort types or if logic falls through
    });
    return currentCourses;
  }, [courses, activeTab, sort]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        Loading courses...
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center text-red-500">
        {error}
      </div>
    );
  }

  if (filteredAndSortedCourses.length === 0 && !loading) {
    return (
      <div className="container mx-auto p-4 text-center text-gray-600">
        No courses found for the selected category.
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col items-stretch">
      <div className="flex justify-center space-x-4 mb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 flex flex-wrap h-auto justify-center">
            {categoryOptions.map((category) => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={activeTab} className="space-y-4 mt-4">
            <div className="flex justify-end mb-4">
              <select
                value={sort}
                onChange={handleSortChange}
                className="border rounded px-2 py-1"
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
      </div>
    </div>
  );
}
