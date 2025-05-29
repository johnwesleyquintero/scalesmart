'use client';

import { AcademyContentClient } from '@/app/academy/components/AcademyContentClient';
import { Course } from '@/types';
import { useState, useMemo, useEffect, useCallback } from 'react';
import ErrorBoundary from '@/components/error-boundary';
import { AcademyProvider } from '@/context/AcademyContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getAllCourses,
  createCourse,
  updateCourse,
} from '@/lib/indexeddb-service';

const DURATION_DESCENDING_SORT = 'Duration (descending)';
const sortOptions = ['Title', 'Duration', 'Level', DURATION_DESCENDING_SORT];

export default function SchoolComponent() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('All');
  const [sort, setSort] = useState('Title');

  const fetchAndStoreCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Try to load from IndexedDB first
      const indexedDBCourses = await getAllCourses();
      if (indexedDBCourses.length > 0) {
        setCourses(indexedDBCourses);
        console.log('Courses loaded from IndexedDB.');
      }

      // Always attempt to fetch latest from server
      const response = await fetch('/api/academy/courses'); // Assuming this endpoint exists
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const serverCourses: Course[] = await response.json();

      // Update IndexedDB with latest server data
      for (const serverCourse of serverCourses) {
        const existingCourse = indexedDBCourses.find(
          (c) => c.id === serverCourse.id,
        );

        if (
          !existingCourse ||
          (serverCourse.updateTimestamp &&
            existingCourse.updateTimestamp &&
            serverCourse.updateTimestamp > existingCourse.updateTimestamp)
        ) {
          // If course doesn't exist or server version is newer, update/create
          await updateCourse(serverCourse);
        }
      }

      // After syncing, get all courses from IndexedDB again to ensure consistency
      const updatedCourses = await getAllCourses();
      setCourses(updatedCourses);
      console.log('Courses synced with server and IndexedDB updated.');
    } catch (e) {
      console.error('Failed to fetch or store courses:', e);
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
        const durationA = parseInt((a.duration || '0 minutes').split(' ')[0]);
        const durationB = parseInt((b.duration || '0 minutes').split(' ')[0]);

        if (isNaN(durationA) && isNaN(durationB)) return 0;
        if (isNaN(durationA)) return 1;
        if (isNaN(durationB)) return -1;
        // Ensure a number is always returned
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

  return (
    <div className="container mx-auto p-4 flex flex-col items-stretch mt-4">
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
            <AcademyProvider initialCourses={filteredAndSortedCourses}>
              <ErrorBoundary>
                <AcademyContentClient courses={filteredAndSortedCourses} />
              </ErrorBoundary>
            </AcademyProvider>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
