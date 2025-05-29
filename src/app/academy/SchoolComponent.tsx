'use client';

import { AcademyContentClient } from '@/components/AcademyContentClient';
import { Course } from '@/types';
import { useState, useMemo } from 'react';
import ErrorBoundary from '@/components/error-boundary';
import { AcademyProvider } from '@/context/AcademyContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Import Tabs

interface SchoolComponentProps {
  academyData: Course[];
}

export default function SchoolComponent({ academyData }: SchoolComponentProps) {
  const [activeTab, setActiveTab] = useState('All'); // Use activeTab for category filter
  const [sort, setSort] = useState('Title');

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSort(event.target.value);
  };

  const categoryOptions = useMemo(() => {
    const categories = new Set<string>();
    academyData.forEach((course) => {
      if (course.metadata?.category) {
        categories.add(course.metadata.category);
      }
    });
    return ['All', ...Array.from(categories).sort()]; // Sort categories alphabetically
  }, [academyData]);

  const filteredAndSortedCourses = useMemo(() => {
    let courses = academyData || [];

    // Filter by activeTab (category)
    courses = courses.filter((course) => {
      if (activeTab === 'All') return true;
      return course.metadata?.category === activeTab;
    });

    // Sort
    courses = courses.sort((a, b) => {
      if (sort === 'Title') {
        return (a.title || '').localeCompare(b.title || '');
      } else if (sort === 'Level') {
        return (a.level || '').localeCompare(b.level || '');
      } else if (sort === 'Duration (descending)') {
        const durationA = parseInt((a.duration || '0 minutes').split(' ')[0]);
        const durationB = parseInt((b.duration || '0 minutes').split(' ')[0]);
        return durationB - durationA;
      } else {
        // Default to 'Duration' (ascending)
        const durationA = parseInt((a.duration || '0 minutes').split(' ')[0]);
        const durationB = parseInt((b.duration || '0 minutes').split(' ')[0]);
        return durationA - durationA; // Fix: should be durationA - durationB
      }
    });
    return courses;
  }, [academyData, activeTab, sort]);

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
          {/* The content for each tab will be the same, just filtered courses */}
          {categoryOptions.map((category) => (
            <TabsContent key={category} value={category} className="space-y-4 mt-4">
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
          ))}
        </Tabs>
      </div>
    </div>
  );
}

const sortOptions = ['Title', 'Duration', 'Level', 'Duration (descending)'];
