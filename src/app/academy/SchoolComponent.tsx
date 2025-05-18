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
import { setItem, getItem, deleteDatabase } from '@/lib/indexeddb-service';
import { cachedFetch } from '@/lib/api-cache';


const moduleItemStyle = 'text-gray-700';

export default function SchoolComponent() {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Moved useState for filter and sort to the top
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('Title');

  useEffect(() => {
    async function fetchCourses() {
      setLoading(true);
      setError(null);
      console.log('Fetching courses from /api/academy-courses');

      // Clear IndexedDB cache
      try {
        console.log('Deleting IndexedDB database');
        await deleteDatabase();
        console.log('IndexedDB database deleted');
      } catch (e) {
        console.error('Error deleting IndexedDB database:', e);
      }

      // Load data from IndexedDB
      try {
        console.time('Load courses from IndexedDB');
        const cachedData = await getItem('courses', 'all');
        if (cachedData) {
          console.log('Courses loaded from IndexedDB:', cachedData);
          setCourses(cachedData as Course[]);
          setLoading(false);
          console.timeEnd('Load courses from IndexedDB');
          return; // Exit the function early
        }
      } catch (e) {
        console.error('Error getting data from IndexedDB:', e);
      }

      try {
        const response = await cachedFetch('/api/academy-courses');
        console.log('API Response Status:', response.status);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response Text:', errorText);
          throw new Error(
            `HTTP error! status: ${response.status}, message: ${
              errorText || response.statusText
            }`,
          );
        }
        const data = await response.json();
        console.log('Data from API:', data);

        if (Array.isArray(data)) {
          setCourses(data); // API returns the array directly
          console.time('Save courses to IndexedDB');
          await setItem('courses', 'all', data); // Store data in IndexedDB
          console.timeEnd('Save courses to IndexedDB');
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

  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(event.target.value);
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSort(event.target.value);
  };

  return (
    // This div now defines the max-width and centering for all its content.
    // Using 'container mx-auto p-4' to match CRM page's container style.
    // items-stretch allows children like AcademyContentClient (w-full) to take full width within the padded container.
    <div className="container mx-auto p-4 flex flex-col items-stretch mt-4">
      <div className="flex justify-center space-x-4 mb-4">
        <select
          value={filter}
          onChange={handleFilterChange}
          className="border rounded px-2 py-1"
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
        >
          {sortOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      {/* courses should be an array by now if no error and not loading */}
      <AcademyProvider initialCourses={courses || []}>
        <AcademyContentClient
          courses={courses || []}
          CourseList={CourseList}
          filter={filter}
          sort={sort}
        />
      </AcademyProvider>
      <div className="mt-4 flex justify-center">
        {' '}
        {/* Centering the button within the max-width container */}
        <Button onClick={handleExportData}>Export Academy Data</Button>
      </div>
    </div>
  );
}

// Rollback strategy: To revert to the previous version, simply remove the IndexedDB code
// and the console.time statements.

const categoryOptions = ['All', 'Amazon SEO', 'Amazon PPC', 'Amazon FBA'];
const sortOptions = ['Title', 'Duration'];

const CourseList = ({
  startCourse,
  courses,
  filter,
  sort,
}: {
  startCourse: (course: Course) => void;
  courses: import('@/types').Course[];
  filter: string;
  sort: string;
}) => {
  const filteredCourses = courses
    .filter((course) => {
      if (filter === 'All') return true;
      return course.category === filter; // Assuming each course has a category property
    })
    .sort((a, b) => {
      if (sort === 'Title') {
        return a.title.localeCompare(b.title);
      }
      // Assuming duration is a string like "2 hours"
      const durationA = parseInt(a.duration.split(' ')[0]);
      const durationB = parseInt(b.duration.split(' ')[0]);
      return durationA - durationB;
    });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {filteredCourses.map((course) => (
        <Card
          key={course.id}
          className={` ${
            course.locked ? 'opacity-75 bg-gray-100' : ''
          } border border-gray-200`}
        >
          <img
            src={course.imageUrl || '/default-fallback.svg'} // Default to your SVG if imageUrl is not present
            alt={`${course.title} course`}
            className="h-40 w-full object-cover rounded-md"
            onError={(e) => {
              // If course.imageUrl was present but failed to load, set to fallback
              e.currentTarget.src = '/default-fallback.svg';
              e.currentTarget.onerror = null; // Prevent infinite loops if the fallback itself fails
            }}
          />
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
              aria-label={
                course.locked ? 'Coming Soon' : `Start ${course.title}`
              } // Add aria-label for accessibility
            >
              {course.locked ? 'Coming Soon' : 'Start Course'}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
