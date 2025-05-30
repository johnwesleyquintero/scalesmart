'use client';

import { useAcademy } from '@/context/AcademyContext';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
              correctAnswer: isNaN(Number(questionData.correctAnswer))
                ? 0
                : Number(questionData.correctAnswer),
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

  // Add navigation functions
  const getCurrentModuleIndex = useCallback(() => {
    if (!activeCourse?.modules || !activeModule) return -1;
    return activeCourse.modules.findIndex((m) => m.id === activeModule.id);
  }, [activeCourse, activeModule]);

  const handleNextModule = useCallback(() => {
    if (!activeCourse?.modules) return;
    const currentIndex = getCurrentModuleIndex();
    if (currentIndex < activeCourse.modules.length - 1) {
      const nextModule = activeCourse.modules[currentIndex + 1];
      handleSelectModule(nextModule);
    }
  }, [activeCourse, getCurrentModuleIndex, handleSelectModule]);

  const handlePreviousModule = useCallback(() => {
    if (!activeCourse?.modules) return;
    const currentIndex = getCurrentModuleIndex();
    if (currentIndex > 0) {
      const previousModule = activeCourse.modules[currentIndex - 1];
      handleSelectModule(previousModule);
    }
  }, [activeCourse, getCurrentModuleIndex, handleSelectModule]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle keyboard shortcuts when a module is active
      if (!activeModule || !activeCourse) return;

      // Check if user is typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          if (event.altKey) {
            handleNextModule();
          }
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          if (event.altKey) {
            handlePreviousModule();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [activeModule, activeCourse, handleNextModule, handlePreviousModule]);

  return (
    <div className="w-full p-4 bg-gray-100 dark:bg-gray-900 rounded-lg shadow-md text-gray-900 dark:text-gray-100">
      {!activeCourse ? (
        <>
          <input
            type="text"
            placeholder="Search courses..."
            className="w-full p-2 mb-4 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
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
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                Recommended Courses
              </h2>
              <ClientCourseList courses={recommendedCourses} />
            </div>
          )}
        </>
      ) : (
        <>
          <div>
            <Button onClick={handleBackToCourses} variant="outline">
              &larr; Back to Courses
            </Button>
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
              {activeCourse.title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Overall Progress: {calculateCourseProgress(activeCourse)}%
            </p>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/4 bg-white dark:bg-gray-800 p-4 rounded shadow-lg">
                <h3 className="text-lg font-semibold mb-3 border-b pb-2 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700">
                  Modules
                </h3>
                {activeCourse.modules && activeCourse.modules.length > 0 ? (
                  <ol className="list-decimal space-y-1 max-h-60 overflow-y-auto">
                    {activeCourse.modules.map((module) => (
                      <li key={module.id}>
                        <button
                          onClick={() => handleSelectModule(module)}
                          className={`w-full text-left p-2.5 rounded-md transition-colors duration-150 flex justify-between items-center text-sm ${
                            activeModule?.id === module.id
                              ? 'bg-blue-100 text-blue-700 font-medium ring-1 ring-blue-300 dark:bg-blue-700 dark:text-white dark:ring-blue-500'
                              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
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
                            className="w-1/3 h-1.5 ml-2 rounded"
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No modules available for this course.
                  </p>
                )}
              </div>
              <div className="w-full md:w-3/4 bg-white dark:bg-gray-800 p-6 rounded shadow-lg min-h-[300px]">
                {activeModule ? (
                  <div>
                    <h3 className="text-xl font-semibold mb-4 pb-2 border-b text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700">
                      {activeModule.title || `Module ${activeModule.id}`}
                    </h3>
                    <ModuleSpecificContent
                      activeModule={activeModule}
                      userProfile={userProfile}
                    />
                    <div className="flex justify-between mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={handlePreviousModule}
                              variant="outline"
                              disabled={getCurrentModuleIndex() <= 0}
                              aria-label="Previous Module"
                            >
                              &larr; Previous Module
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Previous Module (Alt + Left Arrow)</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={handleNextModule}
                              variant="outline"
                              disabled={
                                getCurrentModuleIndex() >=
                                (activeCourse.modules?.length || 0) - 1
                              }
                              aria-label="Next Module"
                            >
                              Next Module &rarr;
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Next Module (Alt + Right Arrow)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 pt-16">
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
