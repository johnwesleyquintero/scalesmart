'use client';

import { useAcademy } from '@/context/AcademyContext';
import useUserProfile from '@/hooks/use-user-profile';
import { getRecommendedCourses } from '@/lib/course-recommendations';
import { Course, ModuleType } from '@/types';
import { useEffect, useState } from 'react';
import CaseStudyModule from './CaseStudyModule';
import ExerciseModule from './ExerciseModule';
import VideoModule from './VideoModule';
// import useUserProfile from '@/hooks/use-user-profile';
// import { getRecommendedCourses } from '@/lib/course-recommendations';

interface AcademyContentProps {
  courses: Course[];
  CourseList: React.ComponentType<{
    startCourse: (course: Course) => void;
    courses: Course[];
  }>;
}

function AcademyContentClient({
  courses,
  CourseList,
  // ActiveCourseDisplay, // Removed unused prop
}: AcademyContentProps) {
  const {
    activeCourse,
    setActiveCourse,
    setActiveModule,
    setCourses,
    activeModule,
  } = useAcademy(); // Added activeModule to destructure
  const { userProfile } = useUserProfile();
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
  const [progressValues, setProgressValues] = useState<{
    [key: `course-${string}-progress`]: number;
  }>({});

  useEffect(() => {
    if (userProfile) {
      const recommended = getRecommendedCourses(userProfile);
      setRecommendedCourses(recommended);
    }
  }, [userProfile]);

  useEffect(() => {
    // Initialize progressValues from academyData
    if (Array.isArray(courses)) {
      const initialProgressValues = courses.reduce(
        (acc, course) => {
          acc[`course-${course.id}-progress`] = course.progress;
          return acc;
        },
        {} as { [key: `course-${string}-progress`]: number },
      );
      setProgressValues(initialProgressValues);
    }
  }, [courses]);

  useEffect(() => {
    // Update courses with progress from progressValues
    if (Array.isArray(courses)) {
      const coursesWithProgress = courses.map((course) => ({
        ...course,
        progress:
          progressValues[`course-${course.id}-progress`] || course.progress,
        locked: course.locked,
      }));
      setCourses(coursesWithProgress);
    }
  }, [courses, progressValues]);

  const startCourse = (course: Course) => {
    setActiveCourse(course);
    if (course.modules && course.modules.length > 0) {
      setActiveModule(course.modules[0]);
      console.log('Setting activeModule:', course.modules[0]);
    }
  };

  console.log('AcademyContentClient: courses prop =', courses); // ADDED LOGGING STATEMENT
  console.log('AcademyContentClient: recommendedCourses =', recommendedCourses); // ADDED LOGGING STATEMENT

  return (
    <div className="max-w-7xl mx-auto p-4 bg-gray-100 rounded-lg shadow-md">
      {/* Page Title Section */}
      <div className="text-center mb-8">
        {/* Optional: remove mb-8 if my-6 on h1 is sufficient */}
        <h1 className="text-3xl font-bold my-6">ScaleSmart Academy</h1>
        <p className="text-lg text-muted-foreground">
          Master Amazon PPC, SEO, and sales strategies with our comprehensive
          courses
        </p>
      </div>
      {/* Module Content or Quiz */}
      {!activeCourse ? (
        <CourseList
          startCourse={startCourse}
          courses={recommendedCourses.length > 0 ? recommendedCourses : courses}
        /> // Pass recommended courses
      ) : (
        <>
          {activeCourse &&
            activeCourse.modules &&
            activeModule &&
            (() => {
              if (!activeModule) {
                return <p>No module selected</p>;
              }
              switch (activeModule?.type) {
                case 'article' as ModuleType:
                  return <p>Article Content Here</p>;
                case 'video' as ModuleType:
                  return <VideoModule />;
                case 'exercise' as ModuleType:
                  return <ExerciseModule />;
                case 'caseStudy' as ModuleType:
                  return <CaseStudyModule />;
                case 'quiz' as ModuleType:
                  return <p>Quiz Content Here</p>;
                default:
                  return <p>Unknown Module Type</p>;
              }
            })()}
        </>
      )}
    </div>
  );
}

export default AcademyContentClient;
