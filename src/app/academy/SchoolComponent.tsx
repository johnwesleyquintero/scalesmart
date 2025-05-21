'use client';

import { AcademyContentClient } from '@/components/AcademyContentClient';
import { Button } from '@/components/ui/button';
import { Course } from '@/types';
import { useState, useMemo } from 'react';
import { AcademyProvider } from '@/context/AcademyContext';
import ClientCourseList from './ClientCourseList'; // Import the new component

interface SchoolComponentProps {
  academyData: Course[];
}

export default function SchoolComponent({ academyData }: SchoolComponentProps) {
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
        <AcademyContentClient
          courses={academyData || []}
          CourseList={ClientCourseList} // Pass the component reference
          filter={filter}
          sort={sort}
        />
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
    if (course.category) {
      categories.add(course.category);
    }
  });
  return Array.from(categories);
};

const sortOptions = ['Title', 'Duration', 'Level', 'Duration (descending)'];
