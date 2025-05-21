'use client';

import { AcademyContentClient } from '@/components/AcademyContentClient';
import { Button } from '@/components/ui/button';
import { Course } from '@/types';
import { useState, useMemo } from 'react';
import ErrorBoundary from '@/components/error-boundary';
import { AcademyProvider } from '@/context/AcademyContext';
import ClientCourseList from './ClientCourseList'; // Import the new component

interface SchoolComponentProps {
  academyData: Course[];
}

export default function SchoolComponent({ academyData }: SchoolComponentProps) {
  console.log('academyData:', JSON.stringify(academyData));
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('Title');

  const handleExportData = async () => {
    try {
      const baseUrl =
        process.env.NODE_ENV === 'development'
          ? 'http://localhost:3000'
          : 'https://wescode.vercel.app';
      const res = await fetch(`${baseUrl}/api/academy-courses`);
      const academyData = await res.json();

      const jsonString = JSON.stringify(academyData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'academy-data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting academy data:', error);
      alert('Failed to export academy data.');
    }
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(event.target.value);
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSort(event.target.value);
  };

  const categoryOptions = useMemo(
    () => getCategoryOptions(academyData),
    [academyData],
  );

  return (
    <div className="container mx-auto p-4 flex flex-col items-stretch mt-4">
      <div className="flex justify-center space-x-4 mb-4">
        <select
          value={filter}
          onChange={handleFilterChange}
          className="border rounded px-2 py-1"
          aria-label="Filter by category"
        >
          {categoryOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
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
      <AcademyProvider initialCourses={academyData || []}>
        <ErrorBoundary>
          <AcademyContentClient
            courses={academyData || []}
            filter={filter}
            sort={sort}
          />
        </ErrorBoundary>
      </AcademyProvider>
      <div className="mt-4 flex justify-center">
        <Button onClick={handleExportData}>Export Academy Data</Button>
      </div>
    </div>
  );
}

const getCategoryOptions = (courses: Course[]) => {
  const categories = new Set<string>(['All']);
  courses.forEach((course) => {
    if (course.metadata?.category) {
      categories.add(course.metadata.category);
    }
  });
  return Array.from(categories);
};

const sortOptions = ['Title', 'Duration', 'Level', 'Duration (descending)'];
