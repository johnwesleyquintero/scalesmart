'use client';

import { Course } from '@/types';
import { BookOpen, Lock } from 'lucide-react';

import AcademyContentClient from '@/components/AcademyContentClient';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AcademyProvider } from '@/context/AcademyContext';
import { useEffect, useState } from 'react';

const moduleItemStyle = 'text-secondary-foreground';

export default function SchoolComponent() {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourses() {
      setLoading(true);
      setError(null);
      console.log('Fetching courses from /api/academy-courses');
      try {
        const response = await fetch('/api/academy-courses');
        console.log('API Response Status:', response.status);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response Text:', errorText);
          throw new Error(
            `HTTP error! status: ${response.status}, message: ${errorText || response.statusText}`,
          );
        }
        const data = await response.json();
        console.log('Data from API:', data);

        if (Array.isArray(data)) {
          setCourses(data); // API returns the array directly
        } else {
          console.error(
            'API Error: Expected an array of courses, but received:',
            data, // Log the actual data received if it's not an array
          );
          setError(
            'Course data from server was not in the expected array format.',
          );
          setCourses([]); // Default to empty array to prevent further errors
        }
      } catch (e) {
        console.error('Failed to fetch courses:', e);
        setError(e instanceof Error ? e.message : 'An unknown error occurred');
        setCourses([]); // Default to empty array on error
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  if (loading) {
    return <p className="text-center p-8">Loading courses...</p>;
  }

  if (error) {
    return (
      <p className="text-center p-8 text-red-500">
        Error loading courses: {error}. Please check the console for more
        details.
      </p>
    );
  }

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

  return (
    <div className="flex justify-end">
      <Button onClick={handleExportData}>Export Academy Data</Button>
      {/* courses should be an array by now if no error and not loading */}
      <AcademyProvider initialCourses={courses || []}>
        <AcademyContentClient courses={courses || []} CourseList={CourseList} />
      </AcademyProvider>
    </div>
  );
}

const CourseList = ({
  startCourse,
  courses,
}: {
  startCourse: (course: Course) => void;
  courses: import('@/types').Course[];
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {courses.map((course) => (
        <Card key={course.id} className={course.locked ? 'opacity-75' : ''}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{course.title}</CardTitle>
                <CardDescription className="mt-1">
                  {course.description}
                </CardDescription>
              </div>
              {course.locked && <Lock className="h-5 w-5 text-yellow-500" />}
            </div>
          </CardHeader>
          <div className="p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="flex items-center">
                <BookOpen className="h-4 w-4 mr-1" />
                {course.duration}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs ${moduleItemStyle}`}
              >
                {course.level}
              </span>
            </div>
          </div>
          <CardFooter>
            <Button
              onClick={() => startCourse(course)}
              disabled={course.locked}
              className="w-full"
            >
              {course.locked ? 'Coming Soon' : 'Start Course'}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
