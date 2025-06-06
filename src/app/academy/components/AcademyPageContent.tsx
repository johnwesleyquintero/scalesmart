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
const fetchAndSyncCourses = async (): Promise<Course[]> => {
  try {
    // Fetch local data first and server data concurrently
    const [indexedDBCourses, serverResponse] = await Promise.all([
      getAllCourses(),
      fetch('/api/academy/courses'),
    ]);

    // Handle server response errors
    if (!serverResponse.ok) {
      // Attempt to read response body for more details, but handle potential errors
      const errorText = await serverResponse
        .text()
        .catch(() => 'Unknown error body');
      throw new Error(
        `HTTP error! status: ${serverResponse.status} from /api/academy/courses. Details: ${errorText}`,
      );
    }
    const serverCourses: Course[] = await serverResponse.json();

    // Determine courses that exist locally but not on the server (to delete locally)
    const serverCourseIds = new Set(serverCourses.map((c) => c.id));
    const coursesToDelete = indexedDBCourses.filter(
      (c) => !serverCourseIds.has(c.id),
    );

    // Delete outdated courses from local DB if any exist
    if (coursesToDelete.length > 0) {
      // Using Promise.all for batch deletion
      await deleteCoursesByIds(coursesToDelete.map((c) => c.id));
    }

    // Update or add courses from the server into the local DB
    const updatePromises = serverCourses.map(async (serverCourse) => {
      const existingCourse = indexedDBCourses.find(
        (c) => c.id === serverCourse.id,
      );

      // Compare update timestamps
      const serverTimestamp = serverCourse.updateTimestamp
        ? new Date(serverCourse.updateTimestamp).getTime()
        : 0;
      const existingTimestamp = existingCourse?.updateTimestamp
        ? new Date(existingCourse.updateTimestamp).getTime()
        : 0;

      // Only update if the server version is newer or the course is new
      if (!existingCourse || serverTimestamp > existingTimestamp) {
        // Use updateCourse which handles both adding and updating
        await updateCourse(serverCourse);
      }
    });

    // Wait for all update/add operations to complete
    await Promise.all(updatePromises);

    // Re-fetch from local DB to ensure data is current after sync operations
    const updatedLocalCourses = await getAllCourses();
    return updatedLocalCourses;
  } catch (error) {
    console.error('Error fetching and syncing courses:', error);
    // Re-throw the error to be caught by useQuery
    if (error instanceof Error) {
      throw error;
    } else {
      // Wrap unknown errors in an Error object
      throw new Error(
        `An unknown error occurred during course sync: ${String(error)}`,
      );
    }
  }
};

/**
 * Parses a duration string (e.g., "2 hours", "30 min") into minutes.
 * Handles variations in units and case insensitivity.
 * @param durationString - The duration string to parse.
 * @returns The duration in minutes, or 0 if parsing fails or input is invalid.
 */
const parseDuration = (durationString: string | null | undefined): number => {
  if (!durationString) return 0;
  const parts = durationString.trim().toLowerCase().split(' ');
  let totalMinutes = 0;
  // Map of unit aliases to their value in minutes
  const minutesPerUnit: Record<string, number> = {
    minute: 1,
    minutes: 1,
    min: 1,
    mins: 1,
    hour: 60,
    hours: 60,
    hr: 60,
    hrs: 60,
    day: 1440,
    days: 1440,
  };

  for (let i = 0; i < parts.length; i += 2) {
    const value = parseInt(parts[i]);
    // Ensure value is a number and there is a unit part
    if (isNaN(value) || !parts[i + 1]) continue;

    // Clean the unit part, removing punctuation like commas/dots
    const unit = parts[i + 1].replace(/[^a-z]/g, '');

    // Find the unit key that matches the parsed unit
    const unitKey = Object.keys(minutesPerUnit).find((key) => key === unit);

    if (unitKey) {
      totalMinutes += value * minutesPerUnit[unitKey];
    }
  }
  return totalMinutes;
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
export function AcademyPageContent() {
  const [activeTab, setActiveTab] = useState('All');
  const [sort, setSort] = useState('Title');
  const searchParams = useSearchParams();
  const { academyData } = useAcademyStorage();

  // Fetch and sync courses using React Query
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

  // Use courseList as a stable reference for memoization dependencies
  // Memoize courseList to ensure a stable reference for memoization dependencies.
  // Provides an empty array as default while loading or if data is null/undefined.
  const courseList: Course[] = useMemo(() => courses ?? [], [courses]);

  const lastVisitedCourseId = academyData?.lastVisitedCourse;
  const lastVisitedModuleId = academyData?.lastVisitedModule;

  // Memoize category options based on fetched courses
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

  // Memoize the sort handler function
  // It doesn't depend on component state or props, so it's stable
  const handleSortChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setSort(event.target.value);
    },
    [],
  );

  // Memoize the filtered and sorted course list
  const filteredAndSortedCourses = useMemo(() => {
    let currentCourses: Course[] = courseList;

    // Apply category filter
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

  // Memoize the last visited course object
  const lastVisitedCourse: Course | undefined | null = useMemo(() => {
    // Only search if courseList is not empty and we have a last visited ID
    if (courseList.length === 0 || !lastVisitedCourseId) return null;
    return courseList.find((course) => course.id === lastVisitedCourseId);
  }, [lastVisitedCourseId, courseList]); // Depend on last visited ID and data

  // Memoize the last visited module object
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
          {/* Use Link with passHref and legacyBehavior for custom children */}
          <Link
            href={`/academy/${lastVisitedCourse.id}?moduleId=${lastVisitedModule.id}`}
            passHref
            legacyBehavior
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
