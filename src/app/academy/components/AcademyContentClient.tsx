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
import useAcademyStorage from '@/hooks/use-academy-storage';

import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import ArticleModule from './ArticleModule';
import VideoModule from './VideoModule';
import CaseStudyModule from '@/components/CaseStudyModule';
import Quiz from './Quiz';
import ClientCourseList from '@/app/academy/components/ClientCourseList';
import { UserProfile } from '@/lib/models/user';

export interface AcademyStorageData {
  lastVisitedCourse?: string | null;
  lastVisitedModule?: string | null;
  // Stores progress for each module (moduleId -> percentage 0-100)
  moduleProgress?: Record<string, number>;
  // Stores quiz results (moduleId -> QuizResult)
  quizResults?: Record<string, QuizResult>;
}

export interface AcademyContentProps {
  courses: Course[];
  initialCourseId?: string | null;
  academyData: AcademyStorageData | undefined; // Add academyData prop
}

import { QuizResult } from '@/types'; // Import QuizResult type

interface ModuleSpecificContentProps {
  activeModule: Module;
  userProfile: UserProfile | null;
  onModuleComplete: (moduleId: string) => void; // Callback for module completion
  onQuizComplete: (moduleId: string, result: QuizResult) => void; // Callback for quiz completion
}

const ModuleSpecificContent: React.FC<ModuleSpecificContentProps> = ({
  activeModule,
  userProfile,
  onModuleComplete,
  onQuizComplete,
}) => {
  const { activeCourse } = useAcademy();

  // Effect to mark article/video modules as complete when viewed
  useEffect(() => {
    if (
      activeModule &&
      (activeModule.type === ModuleType.ARTICLE ||
        activeModule.type === ModuleType.VIDEO ||
        activeModule.type === ModuleType.CASE_STUDY ||
        activeModule.type === ModuleType.SIMULATION)
    ) {
      // For simplicity, mark as complete immediately upon viewing.
      // In a real app, video completion might be based on playback percentage,
      // and article completion on scroll depth or time spent.
      onModuleComplete(activeModule.id);
    }
  }, [activeModule, onModuleComplete]);

  switch (activeModule.type) {
    case ModuleType.ARTICLE:
      return activeModule.contentSlug ? (
        <ArticleModule contentSlug={activeModule.contentSlug} />
      ) : (
        <p>No content available for this module.</p>
      );
    case ModuleType.VIDEO:
      return <VideoModule />;
    case ModuleType.CASE_STUDY:
      return <CaseStudyModule />;
    case ModuleType.QUIZ:
      return activeModule.quiz && activeModule.quiz.questions.length > 0 ? (
        <Quiz
          questions={activeModule.quiz.questions.map((q) => {
            const questionData = q as typeof q & {
              question?: string;
              title?: string;
              correctAnswer?: string | number;
            };
            let parsedCorrectAnswer: number;
            if (typeof questionData.correctAnswer === 'string') {
              parsedCorrectAnswer = parseInt(questionData.correctAnswer, 10);
              // Fallback for non-numeric strings
              if (isNaN(parsedCorrectAnswer)) {
                // If it's a string that's not a number, maybe it's the actual answer value not an index?
                // For now, defaulting to 0 for robustness given the problem context.
                // A better long-term solution might involve clearer types or handling the actual string answer.
                parsedCorrectAnswer = 0;
              }
            } else if (typeof questionData.correctAnswer === 'number') {
              parsedCorrectAnswer = questionData.correctAnswer;
            } else {
              // Default if correctAnswer is undefined or null
              parsedCorrectAnswer = 0;
            }

            return {
              id: questionData.id,
              question: questionData.question || questionData.title || '',
              options: questionData.options || [],
              correctAnswer: parsedCorrectAnswer,
              explanation: questionData.explanation,
            };
          })}
          moduleId={activeModule.id}
          onQuizComplete={(result) => onQuizComplete(activeModule.id, result)} // Pass quiz completion callback
        />
      ) : (
        <p>No quiz questions available for this module.</p>
      );
    case ModuleType.SIMULATION:
      return <p>Simulation Content Here for {activeModule.title}</p>;
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
  const {
    academyData,
    getModuleProgress,
    updateModuleProgress,
    updateQuizResult,
  } = useAcademyStorage();

  const initialCourseHandled = useRef(false);

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
        initialCourseHandled.current = true;
      }
    }
  }, [initialCourseId, allCourses, activeCourse, startCourseAction]);

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

  const startCourse = (selectedCourse: Course) => {
    startCourseAction(selectedCourse);
  };

  const handleSelectModule = useCallback(
    (module: Module) => {
      setActiveModule(module);
      // When a module is selected, mark it as visited (e.g., 1% progress)
      // Actual completion (100%) will be handled by onModuleComplete/onQuizComplete
      if (activeCourse?.id) {
        // Ensure activeCourse.id is available
        updateModuleProgress(activeCourse.id, module.id, 1);
      }
    },
    [setActiveModule, updateModuleProgress, activeCourse?.id], // Add activeCourse.id to dependencies
  );

  const handleModuleCompletion = useCallback(
    (moduleId: string) => {
      if (activeCourse?.id) {
        // Ensure activeCourse.id is available
        updateModuleProgress(activeCourse.id, moduleId, 100);
      }
    },
    [updateModuleProgress, activeCourse?.id], // Add activeCourse.id to dependencies
  );

  const handleQuizCompletion = useCallback(
    (moduleId: string, result: QuizResult) => {
      if (activeCourse?.id) {
        // Ensure activeCourse.id is available
        updateQuizResult(activeCourse.id, moduleId, result); // Pass courseId
        // If quiz is passed, mark module as 100% complete
        if (result.pass) {
          updateModuleProgress(activeCourse.id, moduleId, 100);
        } else {
          // Optionally, set a lower progress or keep current if quiz failed
          // For now, if quiz fails, module is not 100% complete
          updateModuleProgress(activeCourse.id, moduleId, 50); // Example: 50% if attempted but not passed
        }
      }
    },
    [updateModuleProgress, updateQuizResult, activeCourse?.id], // Add activeCourse.id to dependencies
  );

  const handleBackToCourses = () => {
    setActiveCourse(null);
    setActiveModule(null);
  };

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

  const uniqueCourses = useMemo(() => {
    return allCourses.filter(
      (course: Course, index, self) =>
        course.slug && index === self.findIndex((t) => t.slug === course.slug),
    );
  }, [allCourses]);

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
      if (!activeModule || !activeCourse) return;

      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (event.altKey) {
        switch (event.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            handleNextModule();
            event.preventDefault();
            break;
          case 'ArrowLeft':
          case 'ArrowUp':
            handlePreviousModule();
            event.preventDefault();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [activeModule, activeCourse, handleNextModule, handlePreviousModule]);

  const currentModuleIdx = activeCourse ? getCurrentModuleIndex() : -1;

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
            aria-label="Search courses"
          />
          <ClientCourseList
            courses={uniqueCourses.filter((course) =>
              course.title?.toLowerCase()?.includes(searchQuery.toLowerCase()),
            )}
            completedCourseIds={completedCourseIds}
          />
          {recommendedCourses.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                Recommended Courses
              </h2>
              <ClientCourseList
                courses={recommendedCourses}
                completedCourseIds={completedCourseIds}
              />
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
                              : getModuleProgress(module.id) === 100
                                ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium' // Style for completed modules
                                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          aria-label={`Select module ${module.title || module.id}`}
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
                      onModuleComplete={handleModuleCompletion} // Pass completion callback
                      onQuizComplete={handleQuizCompletion} // Pass quiz completion callback
                    />
                    <div className="flex justify-between mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={handlePreviousModule}
                              variant="outline"
                              disabled={currentModuleIdx <= 0}
                              aria-label="Previous Module"
                            >
                              &#8592; Previous Module
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
                                currentModuleIdx >=
                                (activeCourse.modules?.length || 0) - 1
                              }
                              aria-label="Next Module"
                            >
                              Next Module &#8594;
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
