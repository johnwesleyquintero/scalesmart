'use client';

import { useAcademy } from '@/context/AcademyContext';
import { Button } from '@/components/ui/button';
import useUserProfile from '@/hooks/use-user-profile';
import { getRecommendedCourses } from '@/lib/course-recommendations'; // Assuming Module is also in @/types
import { Module, ModuleType } from '@/types';

export interface Course {
  id: string;
  title: string;
  type: ModuleType;
  description: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  locked: boolean;
  progress: number;
  modules: Module[];
  category?: string; // Added category property
  slug: string;
}

import { useEffect, useState } from 'react';
import CaseStudyModule from './CaseStudyModule';
import ExerciseModule from './ExerciseModule';
import VideoModule from './VideoModule';

interface AcademyContentProps {
  courses: Course[];
  CourseList: React.ComponentType<{
    startCourse: (course: Course) => void;
    courses: Course[];
    filter: string;
    sort: string;
  }>;
  filter: string;
  sort: string;
}

function AcademyContentClient({
  courses: allCourses,
  CourseList,
  filter,
  sort,
}: AcademyContentProps) {
  const { activeCourse, setActiveCourse, setActiveModule, activeModule } =
    useAcademy();
  const { userProfile } = useUserProfile();
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (userProfile) {
      const recommended = getRecommendedCourses(userProfile);
      setRecommendedCourses(recommended as Course[]);
    }
  }, [userProfile]);

  useEffect(() => {
    if (activeCourse && activeModule) {
      // Store progress in IndexedDB
      const storeProgress = async () => {
        try {
          // Assuming you have a function to interact with IndexedDB
          // Example: await saveModuleProgress(userProfile?.id, activeCourse.id, activeModule.id, true);
          console.log(
            `Saving progress for user ${userProfile?.id}, course ${activeCourse.id}, module ${activeModule.id}`,
          );
        } catch (error) {
          console.error('Error saving module progress:', error);
        }
      };
      storeProgress();
    }
  }, [activeCourse, activeModule, userProfile]);

  const startCourse = (selectedCourse: Course) => {
    setActiveCourse(selectedCourse);
    if (selectedCourse.modules && selectedCourse.modules.length > 0) {
      setActiveModule(selectedCourse.modules[0]);
    }
  };

  const handleSelectModule = (module: Module) => {
    setActiveModule(module);
  };

  const handleBackToCourses = () => {
    setActiveCourse(null);
    setActiveModule(null);
  };

  // Filter out duplicate courses based on slug
  const courses = allCourses.filter(
    (course: Course, index, self) =>
      course.slug && index === self.findIndex((t) => t.slug === course.slug),
  );

  return (
    <div className="w-full p-4 bg-gray-100 rounded-lg shadow-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold my-6">ScaleSmart Academy</h1>
        <p className="text-lg text-muted-foreground">
          Master Amazon PPC, SEO, and sales strategies with our comprehensive
          courses
        </p>
      </div>

      {!activeCourse ? (
        <CourseList
          startCourse={startCourse}
          courses={
            recommendedCourses.length > 0
              ? recommendedCourses.filter(
                  (recommendedCourse) =>
                    !courses.find(
                      (course) => course.slug === recommendedCourse.slug,
                    ),
                )
              : courses
          }
          filter={filter}
          sort={sort}
        />
      ) : (
        <>
          <div>
            <Button
              onClick={handleBackToCourses}
              variant="outline"
              className="mb-4"
              aria-label="Back to Courses"
            >
              &larr; Back to Courses
            </Button>
            <h2 className="text-2xl font-bold mb-2">{activeCourse.title}</h2>
            <p className="text-sm text-gray-600 mb-4">
              Overall Progress: {activeCourse.progress || 0}%
            </p>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/4 bg-white p-4 rounded shadow-lg">
                <h3 className="text-lg font-semibold mb-3 border-b pb-2">
                  Modules
                </h3>
                {activeCourse.modules && activeCourse.modules.length > 0 ? (
                  <ul className="space-y-1">
                    {activeCourse.modules.map((module) => (
                      <li key={module.id}>
                        <button
                          onClick={() => handleSelectModule(module)}
                          className={`w-full text-left p-2.5 rounded-md hover:bg-gray-100 transition-colors duration-150 flex justify-between items-center text-sm ${
                            activeModule?.id === module.id
                              ? 'bg-blue-100 text-blue-700 font-medium ring-1 ring-blue-300'
                              : 'text-gray-700'
                          }`}
                          aria-label={`Select module ${module.title}`}
                        >
                          <span>{module.title || `Module ${module.id}`}</span>
                          {module.completed && (
                            <span className="text-green-500 text-xs font-medium ml-2">
                              ✓
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">
                    No modules available for this course.
                  </p>
                )}
              </div>
              <div className="w-full md:w-3/4 bg-white p-6 rounded shadow-lg min-h-[300px]">
                {activeModule ? (
                  (() => {
                    const ModuleSpecificContent = () => {
                      switch (activeModule.type) {
                        case 'article' as ModuleType:
                          return (
                            <p>Article Content Here for {activeModule.title}</p>
                          );
                        case 'video' as ModuleType:
                          return <VideoModule />;
                        case 'exercise' as ModuleType:
                          return <ExerciseModule />;
                        case 'caseStudy' as ModuleType:
                          return <CaseStudyModule />;
                        case 'quiz' as ModuleType:
                          return (
                            <p>Quiz Content Here for {activeModule.title}</p>
                          ); // Placeholder for Quiz component
                        default:
                          return (
                            <p>Unknown Module Type: {activeModule.type}</p>
                          );
                      }
                    };
                    return (
                      <div>
                        <h3 className="text-xl font-semibold mb-4 pb-2 border-b">
                          {activeModule.title || `Module ${activeModule.id}`}
                        </h3>
                        <ModuleSpecificContent />
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-center text-gray-500 pt-16">
                    Select a module from the list to view its content.
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export { AcademyContentClient };
