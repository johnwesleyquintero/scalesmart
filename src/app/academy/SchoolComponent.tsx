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
import { useState } from 'react';
import { AcademyProvider } from '@/context/AcademyContext';

const moduleItemStyle = 'text-gray-700';

interface SchoolComponentProps {
  academyData: Course[];
}

export default function SchoolComponent({ academyData }: SchoolComponentProps) {
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('Title');

  const handleExportData = () => {
    const data = localStorage.getItem('academyData');
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'academy-data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert('No academy data found in local storage.');
    }
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(event.target.value);
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSort(event.target.value);
  };

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
          }) =>
            CourseList({ ...props, activeCourse: null })
          }
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

const categoryOptions = ['All', 'Amazon SEO', 'Amazon PPC', 'Amazon FBA'];
const sortOptions = ['Title', 'Duration'];

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
      }
      const durationA = parseInt(a.duration.split(' ')[0]);
      const durationB = parseInt(b.duration.split(' ')[0]);
      return durationA - durationB;
    });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {filteredCourses.map((course, index) => {
        try {
          return (
            <Card
              key={`${course.slug}-${index}`}
              className={` ${
                course.locked ? 'opacity-75 bg-gray-100' : ''
              } border border-gray-200`}
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
                <p className="text-sm text-gray-500">
                  Progress: {course.progress || 0}%
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
