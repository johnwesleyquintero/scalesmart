import { useToast } from '@/hooks/use-toast.ts';
import { Course, QuizResult } from '@/types';
import { useCallback, useEffect } from 'react';
import useAcademyStorageService from '@/lib/academy-storage-service';
import {
  updateModuleProgress as updateModuleProgressDB,
  getModuleProgress as getModuleProgressDB,
  updateQuizResult as updateQuizResultDB,
  getQuizResult as getQuizResultDB,
  getCourseModuleProgress as getCourseModuleProgressDB,
  getAllQuizResultsForUser,
  ModuleProgressRecord,
  QuizResultRecord,
} from '@/lib/indexeddb-service';
import useUserProfile from './use-user-profile';

// Define the comprehensive AcademyDataType here
export interface AcademyDataType {
  courses: Course[];
  lastVisitedCourse?: string | null;
  lastVisitedModule?: string | null;
  moduleProgress?: Record<string, number>;
  quizResults?: Record<string, QuizResult>;
}

const useAcademyStorage = () => {
  const { toast } = useToast();
  const { getAcademyData, setAcademyDataValue } = useAcademyStorageService();
  const academyData = getAcademyData();
  const { userProfile } = useUserProfile();
  const userId = userProfile?.id || 'defaultUserId';

  useEffect(() => {
    const loadInitialData = async () => {
      const allProgressRecords: ModuleProgressRecord[] =
        await getCourseModuleProgressDB(userId, '');
      const moduleProgress: Record<string, number> = {};
      allProgressRecords.forEach((record: ModuleProgressRecord) => {
        moduleProgress[record.moduleId] = record.progress;
      });

      const allQuizResults: QuizResultRecord[] =
        await getAllQuizResultsForUser(userId);
      const quizResults: Record<string, QuizResult> = {};
      allQuizResults.forEach((record: QuizResultRecord) => {
        quizResults[record.moduleId] = record.result;
      });

      setAcademyDataValue((currentData) => ({
        ...currentData,
        moduleProgress: moduleProgress,
        quizResults: quizResults,
      }));
    };
    loadInitialData();
  }, [userId, setAcademyDataValue]);

  const saveData = useCallback(
    (updates: Partial<AcademyDataType>) => {
      try {
        setAcademyDataValue((currentData: AcademyDataType) => {
          const newModuleProgress = {
            ...(currentData.moduleProgress || {}),
            ...(updates.moduleProgress || {}),
          };
          const newQuizResults = {
            ...(currentData.quizResults || {}),
            ...(updates.quizResults || {}),
          };

          const coursesToUse =
            updates.courses !== undefined
              ? updates.courses
              : currentData.courses;

          return {
            ...currentData,
            ...updates,
            courses: coursesToUse,
            moduleProgress: newModuleProgress,
            quizResults: newQuizResults,
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

  const updateModuleProgress = useCallback(
    async (courseId: string, moduleId: string, progress: number) => {
      await updateModuleProgressDB(userId, courseId, moduleId, progress);

      saveData({
        moduleProgress: {
          ...(academyData?.moduleProgress || {}),
          [moduleId]: progress,
        },
      });

      const currentCourses = academyData?.courses || [];
      const updatedCourses = currentCourses.map((course: Course) => {
        if (course.id === courseId) {
          let totalModuleProgress = 0;
          let moduleCount = 0;

          if (course.modules && course.modules.length > 0) {
            const latestModuleProgress = {
              ...(academyData?.moduleProgress || {}),
              [moduleId]: progress,
            };
            totalModuleProgress = course.modules.reduce(
              (sum: number, m: { id: string }) => {
                return sum + (latestModuleProgress[m.id] || 0);
              },
              0,
            );
            moduleCount = course.modules.length;
          }

          const newCourseProgress =
            moduleCount > 0 ? Math.round(totalModuleProgress / moduleCount) : 0;

          return { ...course, progress: newCourseProgress };
        }
        return course;
      });

      saveData({ courses: updatedCourses });
    },
    [userId, saveData, academyData],
  );

  const getModuleProgress = useCallback(
    (moduleId: string) => {
      return academyData?.moduleProgress?.[moduleId] || 0;
    },
    [academyData?.moduleProgress],
  );

  const updateQuizResult = useCallback(
    async (courseId: string, moduleId: string, result: QuizResult) => {
      await updateQuizResultDB(userId, moduleId, result);

      saveData({
        quizResults: {
          ...(academyData?.quizResults || {}),
          [moduleId]: result,
        },
      });
    },
    [userId, saveData, academyData],
  );

  const getQuizResult = useCallback(
    (moduleId: string) => {
      return academyData?.quizResults?.[moduleId];
    },
    [academyData?.quizResults],
  );

  const markCourseVisited = useCallback(
    (courseId: string) => {
      saveData({ lastVisitedCourse: courseId });
    },
    [saveData],
  );

  return {
    academyData,
    saveData,
    updateModuleProgress,
    getModuleProgress,
    updateQuizResult,
    getQuizResult,
    markCourseVisited,
  };
};

export default useAcademyStorage;
