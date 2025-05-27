import { useToast } from '@/hooks/use-toast.ts';
import { Course, QuizResult } from '@/types';
import { useCallback } from 'react';
import useAcademyStorageService from '@/lib/academy-storage-service';

export interface AcademyDataType {
  courses: Course[];
  moduleProgress: Record<string, boolean>; // ModuleId: Completed
  quizResults: Record<string, QuizResult>; // ModuleId: QuizResult
  lastVisitedCourse?: string; // CourseId
  lastVisitedModule?: string; // ModuleId
}

const useAcademyStorage = () => {
  const { toast } = useToast();
  const { getAcademyData, setAcademyDataValue } = useAcademyStorageService();
  const academyData = getAcademyData();

  const saveData = useCallback(
    (updates: Partial<AcademyDataType>) => {
      try {
        // Data validation
        if (updates.courses) {
          if (!Array.isArray(updates.courses)) {
            throw new Error('Courses must be an array.');
          }
          updates.courses.forEach((course: Partial<Course>) => {
            if (
              !course.id ||
              typeof course.id !== 'string' ||
              course.id.trim() === '' ||
              !course.title ||
              typeof course.title !== 'string' ||
              course.title.trim() === ''
            ) {
              throw new Error(
                'Each course must have a non-empty string id and title.',
              );
            }
          });
        }

        setAcademyDataValue((currentData: AcademyDataType) => {
          const newCourses =
            updates.courses !== undefined
              ? updates.courses
              : currentData.courses;

          const newModuleProgress =
            updates.moduleProgress !== undefined
              ? { ...currentData.moduleProgress, ...updates.moduleProgress }
              : currentData.moduleProgress;

          const newQuizResults =
            updates.quizResults !== undefined
              ? { ...currentData.quizResults, ...updates.quizResults }
              : currentData.quizResults;

          const newLastVisitedCourse =
            updates.lastVisitedCourse !== undefined
              ? updates.lastVisitedCourse
              : currentData.lastVisitedCourse;

          const newLastVisitedModule =
            updates.lastVisitedModule !== undefined
              ? updates.lastVisitedModule
              : currentData.lastVisitedModule;

          return {
            ...currentData,
            ...updates,
            courses: newCourses || [],
            moduleProgress: newModuleProgress || {},
            quizResults: newQuizResults || {},
            lastVisitedCourse: newLastVisitedCourse,
            lastVisitedModule: newLastVisitedModule,
          };
        });

        toast({
          title: 'Data Saved',
          description: 'Academy data has been updated successfully.',
        });
      } catch (error: unknown) {
        console.error('Failed to save academy data:', error);
        if (
          error instanceof DOMException &&
          error.name === 'QuotaExceededError'
        ) {
          toast({
            title: 'Storage Limit Exceeded',
            description:
              'Local storage limit exceeded. Please clear some data or try again later.',
          });
        } else {
          toast({
            title: 'Error',
            description: 'Could not save academy data. Please try again.',
          });
        }
      }
    },
    [setAcademyDataValue, toast],
  );

  const markModuleComplete = useCallback(
    (moduleId: string) => {
      saveData({ moduleProgress: { [moduleId]: true } });
    },
    [saveData],
  );

  const updateQuizResult = useCallback(
    (moduleId: string, result: QuizResult) => {
      saveData({ quizResults: { [moduleId]: result } });
    },
    [saveData],
  );

  const markCourseVisited = useCallback(
    (courseId: string) => {
      saveData({ lastVisitedCourse: courseId });
    },
    [saveData],
  );

  const markModuleVisited = useCallback(
    (moduleId: string) => {
      saveData({ lastVisitedModule: moduleId });
    },
    [saveData],
  );

  return {
    academyData,
    saveData,
    markModuleComplete,
    updateQuizResult,
    markCourseVisited,
    markModuleVisited,
  };
};

export default useAcademyStorage;
