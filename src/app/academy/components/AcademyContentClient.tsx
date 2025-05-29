'use client';

import { useAcademy } from '@/context/AcademyContext';
import { Button } from '@/components/ui/button';
import useUserProfile from '@/hooks/use-user-profile';
import { getRecommendedCourses } from '@/lib/course-recommendations';
import { Module, ModuleType, Course } from '@/types';
import useAcademyStorage from '@/hooks/use-academy-storage'; // Import the hook

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import ArticleModule from './ArticleModule';
import VideoModule from './VideoModule';
import ExerciseModule from '../../../components/ExerciseModule';
import CaseStudyModule from '../../../components/CaseStudyModule';
import Quiz from './Quiz';
import ClientCourseList from '@/app/academy/components/ClientCourseList';
import { UserProfile } from '@/lib/models/user'; // Corrected import for UserProfile type

interface AcademyContentProps {
  courses: Course[];
  initialCourseId?: string | null;
}

interface ModuleSpecificContentProps {
  activeModule: Module;
  userProfile: UserProfile | null; // Pass userProfile as a prop
}

const ModuleSpecificContent: React.FC<ModuleSpecificContentProps> = ({
  activeModule,
  userProfile, // Destructure userProfile
}) => {
  const { activeCourse } = useAcademy();

  switch (activeModule.type) {
    case ModuleType.ARTICLE:
      return activeModule.contentSlug ? (
        <ArticleModule contentSlug={activeModule.contentSlug} />
      ) : (
        <p>No content available for this module.</p>
      );
    case ModuleType.VIDEO:
      return <VideoModule />;
    case ModuleType.EXERCISE:
      return activeModule.exercise ? (
        <ExerciseModule
          exercise={activeModule.exercise}
          userId={userProfile?.id || 'defaultUserId'}
          courseId={activeCourse?.id || 'defaultCourseId'}
          moduleId={activeModule.id || 'defaultModuleId'}
        />
      ) : (
        <p>No exercise content available for this module.</p>
      );
    case ModuleType.CASE_STUDY:
      return <CaseStudyModule />;
    case ModuleType.QUIZ:
      return activeModule.quiz && activeModule.quiz.questions.length > 0 ? (
        <Quiz
          questions={activeModule.quiz.questions.map((q) => {
            // q's type is inferred from activeModule.quiz.questions
            // Cast q to its own type intersected with potential 'question' and 'title' fields.
            // This avoids 'any' and provides better type safety for accessing these optional fields.
            const questionData = q as typeof q & {
              question?: string;
              title?: string;
            };
            return {
              id: questionData.id,
              question: questionData.question || questionData.title || '', // Ensure 'question' property is provided
              options: questionData.options,
              // Convert the string index from MDX/source to a number.
              // The error indicates questionData.correctAnswer is a string.
              // The Quiz component expects a number (index).
              correctAnswer: parseInt(questionData.correctAnswer as string, 10),
              explanation: questionData.explanation,
            };
          })}
          moduleId={activeModule.id}
        />
      ) : (
        <p>No quiz questions available for this module.</p>
      );
    case ModuleType.SIMULATION:
      return <p>Simulation Content Here for {activeModule.title}</p>; // Placeholder for Simulation component
    default:
      return <p>Unknown Module Type: {activeModule.type}</p>;
  }
};

function AcademyContentClient({
  courses: allCourses,
  initialCourseId,
}: AcademyContentProps) {
  const {
    activeCourse,
    setActiveCourse,
    activeModule,
    setActiveModule,
    startCourseAction,
  } = useAcademy();
  const { userProfile } = useUserProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
  const { academyData, getModuleProgress, markModuleVisited } =
    useAcademyStorage();

  const initialCourseHandled = useRef(false);

  // Effect to handle initial course selection from URL parameter
  useEffect(() => {
    if (
      initialCourseId &&
      allCourses.length > 0 &&
      !activeCourse &&
      !initialCourseHandled.current
    ) {
      const courseToSelect = allCourses.find((c) => c.id === initialCourseId);
      if (courseToSelect) {
        startCourseAction(courseToSelect);
        initialCourseHandled.current = true; // Mark as handled
      }
    }
  }, [initialCourseId, allCourses, activeCourse, startCourseAction]);

  // Calculate completed course IDs based on module progress
  const completedCourseIds = useMemo(() => {
    const completed = new Set<string>();
    allCourses.forEach((course) => {
      if (course.modules && course.modules.length > 0) {
        const allModulesCompleted = course.modules.every(
          (m) => getModuleProgress(m.id) === 100,
        );
        if (allModulesCompleted) {
          completed.add(course.id);
        }
      }
    });
    return Array.from(completed);
  }, [allCourses, getModuleProgress]);

  useEffect(() => {
    if (userProfile) {
      getRecommendedCourses(userProfile, completedCourseIds).then(
        (recommended) => {
          setRecommendedCourses(recommended as Course[]);
        },
      );
    }
  }, [userProfile, completedCourseIds]);

  useEffect(() => {
    // This useEffect is no longer needed as markModuleVisited is called directly on interaction.
  }, []);

  const startCourse = (selectedCourse: Course) => {
    startCourseAction(selectedCourse); // Use the context action
    // The context's startCourseAction will handle setting activeCourse and activeModule
  };

  const handleSelectModule = (module: Module) => {
    setActiveModule(module); // Set active module
    markModuleVisited(module.id); // Mark module as visited when selected
  };

  const handleBackToCourses = () => {
    setActiveCourse(null);
    setActiveModule(null);
  };

  // Calculate overall course progress
  const calculateCourseProgress = useCallback(
    (course: Course) => {
      if (!course.modules || course.modules.length === 0) {
        return 0;
      }
      const totalProgress = course.modules.reduce((sum, module) => {
        return sum + getModuleProgress(module.id);
      }, 0);
      return Math.round(totalProgress / course.modules.length);
    },
    [getModuleProgress],
  );

  // Filter out duplicate courses based on slug
  const courses = allCourses.filter(
    (course: Course, index, self) =>
      course.slug && index === self.findIndex((t) => t.slug === course.slug),
  );

  return (
    <div className="w-full p-4 bg-gray-100 rounded-lg shadow-md">
      {!activeCourse ? (
        <>
          <input
            type="text"
            placeholder="Search courses..."
            className="w-full p-2 mb-4 border rounded"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <ClientCourseList
            courses={courses.filter((course) =>
              course.title?.toLowerCase()?.includes(searchQuery.toLowerCase()),
            )}
          />
          {recommendedCourses.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Recommended Courses</h2>
              <ClientCourseList courses={recommendedCourses} />
            </div>
          )}
        </>
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
              Overall Progress: {calculateCourseProgress(activeCourse)}%
            </p>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/4 bg-white p-4 rounded shadow-lg">
                <h3 className="text-lg font-semibold mb-3 border-b pb-2">
                  Modules
                </h3>
                {activeCourse.modules && activeCourse.modules.length > 0 ? (
                  <ol className="list-decimal space-y-1 max-h-60 overflow-y-auto">
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
                          title={module.title || `Module ${module.id}`}
                        >
                          <span>{module.title || `Module ${module.id}`}</span>
                          {getModuleProgress(module.id) === 100 && (
                            <span className="text-green-500 text-xs font-medium ml-2">
                              ✓
                            </span>
                          )}
                          <progress
                            className="w-1/3 h-1.5 ml-2 rounded" // Example styling, adjust as needed
                            value={getModuleProgress(module.id)}
                            max="100"
                            aria-valuenow={getModuleProgress(module.id)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          ></progress>
                        </button>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-gray-500">
                    No modules available for this course.
                  </p>
                )}
              </div>
              <div className="w-full md:w-3/4 bg-white p-6 rounded shadow-lg min-h-[300px]">
                {activeModule ? (
                  <div>
                    <h3 className="text-xl font-semibold mb-4 pb-2 border-b">
                      {activeModule.title || `Module ${activeModule.id}`}
                    </h3>
                    <ModuleSpecificContent
                      activeModule={activeModule}
                      userProfile={userProfile}
                    />
                  </div>
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
