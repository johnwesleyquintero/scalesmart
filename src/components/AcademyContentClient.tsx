'use client';

import { useAcademy } from '@/context/AcademyContext';
import { Course } from '@/types';
import { useEffect, useState } from 'react';

interface AcademyContentProps {
  courses: Course[];
  CourseList: React.ComponentType<{ startCourse: (course: Course) => void }>;
  ActiveCourseDisplay: React.ComponentType<{}>;
}

function AcademyContentClient({
  courses,
  CourseList,
  ActiveCourseDisplay,
}: AcademyContentProps) {
  const { activeCourse, setActiveCourse, setActiveModule, setCourses } =
    useAcademy();

  const [progressValues, setProgressValues] = useState<{
    [key: `course-${string}-progress`]: number;
  }>(
    courses.reduce(
      (acc, course) => {
        acc[`course-${course.id}-progress`] = course.progress;
        return acc;
      },
      {} as { [key: `course-${string}-progress`]: number },
    ),
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedProgressValues: { [key: string]: number } = {};
    courses.forEach((course) => {
      const key = `course-${course.id}-progress`;
      const item = localStorage.getItem(key);
      storedProgressValues[key] = item ? parseInt(item, 10) : course.progress;
    });

    setProgressValues(storedProgressValues as { [key: string]: number });
  }, [courses]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    courses.forEach((course) => {
      const key = `course-${course.id}-progress`;
      localStorage.setItem(
        key,
        progressValues[key as keyof typeof progressValues]?.toString() ||
          course.progress.toString(),
      );
    });
  }, [courses, progressValues]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const coursesWithLocalStorage = courses.map((course) => ({
      ...course,
      progress:
        progressValues[
          `course-${course.id}-progress` as keyof typeof progressValues
        ] || course.progress,
    }));

    setCourses(coursesWithLocalStorage);
  }, [courses, progressValues, setCourses]);

  const startCourse = (course: Course) => {
    setActiveCourse(course);
    if (course.modules && course.modules.length > 0) {
      setActiveModule(course.modules[0]);
      console.log('Setting activeModule:', course.modules[0]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Page Title Section */}
      <div className="text-center mb-8">
        {/* Optional: remove mb-8 if my-6 on h1 is sufficient */}
        <h1 className="text-3xl font-bold my-6">Amazon Seller Academy</h1>
        <p className="text-lg text-muted-foreground">
          Master Amazon PPC, SEO, and sales strategies with our comprehensive
          courses
        </p>
      </div>
      {/* Module Content or Quiz */}
      {!activeCourse ? (
        <CourseList startCourse={startCourse} />
      ) : (
        <ActiveCourseDisplay />
      )}
    </div>
  );
}

export default AcademyContentClient;
