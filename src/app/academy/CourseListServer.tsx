import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Course } from '@/types';
import { BookOpen, Lock } from 'lucide-react';

async function fetchCourses() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/academy-courses`,
    );
    const data = await response.json();
    // API returns the array directly, not nested under a 'courses' key
    if (Array.isArray(data)) {
      return data as Course[];
    }
    // Log an error and return an empty array if the data is not an array
    console.error(
      'Error fetching courses in CourseListServer: API did not return an array. Received:',
      data,
    );
    return [];
  } catch (error) {
    // Log the specific error
    console.error('Error fetching courses in CourseListServer:', error);
    return [];
  }
}

const CourseListServer = async () => {
  const courses = await fetchCourses();

  return <CourseList courses={courses} />;
};

const CourseList = ({ courses }: { courses: Course[] }) => {
  const textColor = 'text-secondary-foreground';
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
                className={`px-2 py-1 rounded-full text-xs ${
                  course.level === 'Beginner'
                    ? textColor
                    : course.level === 'Intermediate'
                      ? textColor
                      : textColor
                }`}
              >
                {course.level}
              </span>
            </div>
          </div>
          <CardFooter>
            <Button disabled={course.locked} className="w-full">
              {course.locked ? 'Coming Soon' : 'Start Course'}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default CourseListServer;
