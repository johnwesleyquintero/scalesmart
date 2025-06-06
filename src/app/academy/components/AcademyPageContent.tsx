'use client';

import React, { useMemo, useCallback, useState } from 'react';
import {
  AcademyContentClient,
  AcademyContentProps as _AcademyContentProps, // Renamed to _AcademyContentProps
  AcademyStorageData as _AcademyStorageData, // Renamed to _AcademyStorageData
} from '@/app/academy/components/AcademyContentClient';
import { Course, Module } from '@/types';
import ErrorBoundary from '@/components/ui/error-boundary';
import { AcademyProvider } from '@/context/AcademyContext'; // Assuming this is correctly implemented Context Provider
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useAcademyStorage from '@/hooks/use-academy-storage';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  getAllCourses,
  updateCourse,
  deleteCoursesByIds,
} from '@/lib/indexeddb-service';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

const DURATION_DESCENDING_SORT = 'Duration (descending)';
const sortOptions = ['Title', 'Duration', 'Level', DURATION_DESCENDING_SORT];

/**
 * Fetches courses from the server and syncs them with IndexedDB.
 * Handles updates and deletions to keep local data consistent with the server.
 * @returns A promise resolving to an array of Course objects from IndexedDB.
 * @throws Error if fetching or syncing fails.
 */
import { parseDuration } from '@/lib/core-utils'; // Centralized utility

/**
 * Fetches courses from the server API.
 * @returns A promise resolving to an array of Course objects from the server.
 * @throws Error if the network request fails or the server responds with an error status.
 */
const fetchServerCourses = async (): Promise<Course[]> => {
  const serverResponse = await fetch('/api/academy/courses');
  if (!serverResponse.ok) {
    const errorText = await serverResponse
      .text()
      .catch(() => 'Unknown error body');
    throw new Error(
      `HTTP error! status: ${serverResponse.status} from /api/academy/courses. Details: ${errorText}`,
    );
  }
  return serverResponse.json();
};

/**
 * Syncs local IndexedDB courses with server courses.
 * Deletes courses present locally but not on the server, and updates/adds courses from the server.
 * @param indexedDBCourses - Courses currently stored in IndexedDB.
 * @param serverCourses - Courses fetched from the server.
 */
const syncLocalCourses = async (
  indexedDBCourses: Course[],
  serverCourses: Course[],
): Promise<void> => {
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
    const serverTimestamp = serverCourse.updateTimestamp
      ? new Date(serverCourse.updateTimestamp).getTime()
      : 0;
    const existingTimestamp = existingCourse?.updateTimestamp
      ? new Date(existingCourse.updateTimestamp).getTime()
      : 0;

    if (!existingCourse || serverTimestamp > existingTimestamp) {
      await updateCourse(serverCourse);
    }
  });

  await Promise.all(updatePromises);
};

/**
 * Fetches courses from the server and syncs them with IndexedDB.
 * Handles updates and deletions to keep local data consistent with the server.
 * @returns A promise resolving to an array of Course objects from IndexedDB.
 * @throws Error if fetching or syncing fails.
 */
const fetchAndSyncCourses = async (): Promise<Course[]> => {
  try {
    const [indexedDBCourses, serverCourses] = await Promise.all([
      getAllCourses(),
      fetchServerCourses(),
    ]);

    await syncLocalCourses(indexedDBCourses, serverCourses);

    // Re-fetch from local DB to ensure data is current after sync operations
    return await getAllCourses();
  } catch (error) {
    console.error('Error fetching and syncing courses:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(
        `An unknown error occurred during course sync: ${String(error)}`,
      );
    }
  }
};

/**
 * AcademyPageContent Component
 *
 * Fetches and syncs academy course data, manages filter and sort states,
 * and renders the appropriate content layout including "Continue Learning"
 * and categorized/sortable course lists.
 *
 * Uses React Query for data fetching and state management, useAcademyStorage
 * for persisting user progress, and various Shadcn UI components.
 */

/**
 * AcademyPageContent Component
 *
 * Fetches and syncs academy course data, manages filter and sort states,
 * and renders the appropriate content layout including "Continue Learning"
 * and categorized/sortable course lists.
 *
 * Uses React Query for data fetching and state management, useAcademyStorage
 * for persisting user progress, and various Shadcn UI components.
 */
export function AcademyPageContent() {
  // State for managing the active category tab and the selected sort option
  const [activeTab, setActiveTab] = useState('All');
  const [sort, setSort] = useState('Title');
  const searchParams = useSearchParams();
  // Hook to access user's academy progress data
  const { academyData } = useAcademyStorage();

  // Fetch and sync courses using React Query for efficient data management
  const {
    data: courses,
    isLoading,
    isError,
    error,
  } = useQuery<Course[], Error>({
    queryKey: ['academyCourses'],
    queryFn: fetchAndSyncCourses,
    // Configure cache and stale time
    staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache is garbage collected after 10 minutes if unused
    retry: 1, // Retry the query once on failure
    // Optional: Add refetchOnWindowFocus: false if you don't want refetching on tab switch
    // refetchOnWindowFocus: false,
  });

  // Memoize the list of courses to ensure a stable reference for memoization dependencies.
  // Provides an empty array as default while loading or if data is null/undefined.
  const courseList: Course[] = useMemo(() => courses ?? [], [courses]);

  const lastVisitedCourseId = academyData?.lastVisitedCourse;
  const lastVisitedModuleId = academyData?.lastVisitedModule;

  // Memoize category options based on the fetched courses.
  // This prevents re-calculating categories unless the course list changes.
  const categoryOptions = useMemo(() => {
    const categories = new Set<string>();
    courseList.forEach((course) => {
      // Check if metadata and category exist before adding
      if (course.metadata?.category) {
        categories.add(course.metadata.category);
      }
    });
    // Ensure 'All' is always the first option and categories are sorted
    return ['All', ...Array.from(categories).sort()];
  }, [courseList]); // Re-calculate only when courseList reference changes

  // Memoize the sort handler function using useCallback.
  // This ensures the function reference is stable across renders,
  // preventing unnecessary re-renders of child components that might receive it as a prop.
  const handleSortChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setSort(event.target.value);
    },
    [],
  );

  // Memoize the filtered and sorted course list using useMemo.
  // This ensures the filtering and sorting logic only runs when
  // the course list, active tab, or sort option changes.
  const filteredAndSortedCourses = useMemo(() => {
    let currentCourses: Course[] = courseList;

    // Apply category filter based on the active tab
    currentCourses = currentCourses.filter((course) => {
      if (activeTab === 'All') return true;
      // Ensure metadata exists before checking category
      return course.metadata?.category === activeTab;
    });

    // Apply sorting
    currentCourses = currentCourses.sort((a, b) => {
      if (sort === 'Title') {
        // Sort by title alphabetically (case-insensitive with localeCompare)
        const titleA = a.title || '';
        const titleB = b.title || '';
        return titleA.localeCompare(titleB);
      } else if (sort === 'Level') {
        // Sort by level using a predefined order
        const levelOrder: Record<string, number> = {
          Beginner: 1,
          Intermediate: 2,
          Advanced: 3,
          Expert: 4,
        };
        const levelA = a.level || ''; // Use empty string as fallback for undefined/null
        const levelB = b.level || ''; // Use empty string as fallback

        const orderA = levelOrder[levelA] ?? Infinity; // Unknown levels sort last
        const orderB = levelOrder[levelB] ?? Infinity;

        if (orderA !== Infinity || orderB !== Infinity) {
          // If at least one is a known level, sort by order
          return orderA - orderB;
        } else {
          // If both are unknown, sort alphabetically by level string
          return levelA.localeCompare(levelB);
        }
      } else if (sort.startsWith('Duration')) {
        // Sort by duration (parsed to minutes)
        const durationA = parseDuration(a.duration);
        const durationB = parseDuration(b.duration);

        return sort === DURATION_DESCENDING_SORT
          ? durationB - durationA // Descending
          : durationA - durationB; // Ascending
      }
      // Default: no change in order if sort type is unrecognized
      return 0;
    });
    return currentCourses;
  }, [courseList, activeTab, sort]); // Depend on data, filter, and sort states

  // Memoize the last visited course object using useMemo.
  // This prevents re-searching the course list unless the last visited ID or the course list changes.
  const lastVisitedCourse: Course | undefined | null = useMemo(() => {
    // Only search if courseList is not empty and we have a last visited ID
    if (courseList.length === 0 || !lastVisitedCourseId) return null;
    return courseList.find((course) => course.id === lastVisitedCourseId);
  }, [lastVisitedCourseId, courseList]); // Depend on last visited ID and data

  // Memoize the last visited module object using useMemo.
  // This prevents re-searching the modules unless the last visited course or module ID changes.
  const lastVisitedModule: Module | undefined | null = useMemo(() => {
    // Only search if lastVisitedCourse is found, has modules, and we have a last visited module ID
    if (
      !lastVisitedCourse?.modules ||
      lastVisitedCourse.modules.length === 0 ||
      !lastVisitedModuleId
    ) {
      return null;
    }
    return lastVisitedCourse.modules.find(
      (module) => module.id === lastVisitedModuleId,
    );
  }, [lastVisitedCourse, lastVisitedModuleId]); // Depend on last visited course object and module ID

  // --- Conditional Rendering based on Query State ---

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 text-center">
        Loading courses...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto p-4 text-center text-red-500">
        Error loading courses: {error?.message || 'An unknown error occurred.'}
      </div>
    );
  }

  // If courses are loaded but the *initial* list is empty
  if (courseList.length === 0) {
    return (
      <div className="container mx-auto p-4 text-center text-muted-foreground">
        No courses available at this time.
      </div>
    );
  }

  // --- Main Content Rendering ---

  return (
    <div className="p-4 flex flex-col items-stretch bg-card rounded-xl shadow-lg">
      {/* "Continue Learning" section - only render if last visited course/module exist */}
      {lastVisitedCourse && lastVisitedModule && (
        <div className="mb-6 p-4 border rounded-md bg-muted/50">
          <h3 className="text-lg font-semibold mb-2">Continue Learning</h3>
          <p className="text-muted-foreground mb-4">
            Pick up where you left off in &quot;
            {lastVisitedCourse.title || 'Untitled Course'}&quot; - &quot;
            {lastVisitedModule.title || 'Untitled Module'}&quot;
          </p>
          {/* Use Link with passHref for custom children (legacyBehavior is deprecated in Next.js 13+) */}
          <Link
            href={`/academy/${lastVisitedCourse.id}?moduleId=${lastVisitedModule.id}`}
            passHref
          >
            {/* Button component acts as a container, asChild passes props to the child */}
            <Button asChild>
              {/* The <a> tag is the actual element receiving the link props */}
              <a>Continue</a>
            </Button>
          </Link>
        </div>
      )}

      {/* Tabs for Categories */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Use role="tablist" explicitly if needed for ARIA compliance, though TabsList likely handles this */}
        <TabsList className="mb-4 flex flex-wrap h-auto justify-center bg-muted">
          {/* Render category tabs from memoized options */}
          {categoryOptions.map((category) => (
            <TabsTrigger
              key={category} // Key prop for list rendering
              value={category}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground flex-grow sm:flex-grow-0"
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Content for each Tab */}
        <TabsContent value={activeTab} className="space-y-4 mt-4">
          {/* Sort Dropdown */}
          <div className="flex justify-end mb-4">
            {/* Use label with htmlFor or aria-label for accessibility */}
            <label htmlFor="sort-select" className="sr-only">
              Sort by
            </label>
            <select
              id="sort-select"
              value={sort}
              onChange={handleSortChange} // Use memoized handler
              className="border rounded px-2 py-1 bg-background text-foreground border-border"
              aria-label="Sort by" // Fallback ARIA label if sr-only label isn't sufficient
            >
              {/* Render sort options */}
              {sortOptions.map((option) => (
                <option key={option} value={option}>
                  {' '}
                  {/* Key prop for list rendering */}
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Display message if no courses match filter, otherwise render the course list component */}
          {filteredAndSortedCourses.length === 0 ? (
            <div className="flex justify-center items-center min-h-[200px] text-muted-foreground">
              No courses found for the selected category.
            </div>
          ) : (
            // Render filtered/sorted courses using the client component and context provider
            // Fix: Replaced `{}` return with the actual JSX element
            <AcademyProvider>
              {/* ErrorBoundary catches potential errors within the client component tree */}
              <ErrorBoundary>
                <AcademyContentClient
                  courses={filteredAndSortedCourses} // Pass filtered and sorted data
                  initialCourseId={searchParams.get('courseId')}
                  academyData={academyData}
                />
              </ErrorBoundary>
            </AcademyProvider>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
