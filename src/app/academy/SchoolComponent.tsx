'use client';

import { AcademyContentClient } from '@/components/AcademyContentClient';
import { Button } from '@/components/ui/button';
import { Course } from '@/types';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useState, useMemo } from 'react';
import { AcademyProvider } from '@/context/AcademyContext';

const moduleItemStyle = 'text-gray-700';

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
          CourseList={(props: {
            startCourse: (course: Course) => void;
            courses: Course[];
            filter: string;
            sort: string;
          }) => CourseList({ ...props, activeCourse: null })}
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

const CourseList = ({
  startCourse,
  courses,
  filter,
  sort,
}: {
  startCourse: (course: Course) => void;
  courses: Course[];
  filter: string;
  sort: string;
  activeCourse: Course | null;
}) => {
  const filteredCourses = courses
    .filter((course) => {
      if (filter === 'All') return true;
      return course.category === filter;
    })
    .sort((a, b) => {
      if (sort === 'Title') {
        return a.title.localeCompare(b.title);
      } else if (sort === 'Level') {
        return a.level.localeCompare(b.level);
      } else if (sort === 'Duration (descending)') {
        const durationA = parseInt((a.duration || '0 minutes').split(' ')[0]);
        const durationB = parseInt((b.duration || '0 minutes').split(' ')[0]);
        return durationB - durationA;
      } else {
        const durationA = parseInt((a.duration || '0 minutes').split(' ')[0]);
        const durationB = parseInt((b.duration || '0 minutes').split(' ')[0]);
        return durationA - durationB;
      }
    });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
      {filteredCourses.map((course, index) => {
        try {
          return (
            <Card
              key={`${course.slug}-${index}`}
              className={` ${
                course.locked ? 'opacity-75 bg-gray-100' : ''
              } border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300`}
            >
              <CardHeader>
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
                  onClick={() => startCourse(course)}
                  disabled={course.locked}
                  className="w-full"
                  aria-label={
                    course.locked ? 'Coming Soon' : `Start ${course.title}`
                  }
                >
                  {course.locked ? 'Coming Soon' : 'Start Course'}
                </Button>
              </CardFooter>
            </Card>
          );
        } catch (error) {
          console.error('Error rendering course:', course, error);
          return null;
        }
      })}
    </div>
  );
};
