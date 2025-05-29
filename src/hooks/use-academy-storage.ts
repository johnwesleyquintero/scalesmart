import { useToast } from '@/hooks/use-toast.ts';
import { Course, QuizResult } from '@/types';
import { useCallback, useState, useEffect } from 'react';
import useAcademyStorageService from '@/lib/academy-storage-service';
import {
  updateModuleProgress as updateModuleProgressDB,
  getModuleProgress as getModuleProgressDB,
  getCourseModuleProgress as getCourseModuleProgressDB,
  ModuleProgressRecord,
} from '@/lib/indexeddb-service';
import useUserProfile from './use-user-profile';

export interface AcademyDataType {
  courses: Course[];
  lastVisitedCourse?: string; // CourseId
  lastVisitedModule?: string; // ModuleId
}

const useAcademyStorage = () => {
  const { toast } = useToast();
  const { getAcademyData, setAcademyDataValue } = useAcademyStorageService();
  const academyData = getAcademyData();
  const { userProfile } = useUserProfile();
  const userId = userProfile?.id || 'defaultUserId'; // Fallback to a default user ID

  const [moduleProgressMap, setModuleProgressMap] = useState<
    Record<string, number>
  >({}); // moduleId: progress (0-100)
  const [quizResultsMap, setQuizResultsMap] = useState<
    Record<string, QuizResult>
  >({}); // moduleId: QuizResult

  // Load initial module progress and quiz results from IndexedDB
  useEffect(() => {
    const loadProgress = async () => {
      const allProgressRecords = await getCourseModuleProgressDB(userId, '');
      const progressMap: Record<string, number> = {};
      allProgressRecords.forEach((record) => {
        progressMap[record.moduleId] = record.progress;
      });
      setModuleProgressMap(progressMap);
    };
    loadProgress();
  }, [userId]);

  const saveData = useCallback(
    (updates: Partial<AcademyDataType>) => {
      try {
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

  const markModuleProgress = useCallback(
    async (courseId: string, moduleId: string, progress: number) => {
      await updateModuleProgressDB(userId, courseId, moduleId, progress);
      setModuleProgressMap((prev) => ({ ...prev, [moduleId]: progress }));

      // Recalculate and update course progress
      const currentCourses = academyData?.courses || [];
      const updatedCourses = currentCourses.map((course) => {
        if (course.id === courseId) {
          let totalModuleProgress = 0;
          let moduleCount = 0;

          if (course.modules && course.modules.length > 0) {
            // Use the latest progress from moduleProgressMap (which includes the just-updated module)
            // and fall back to 0 if not found (e.g., for new modules)
            totalModuleProgress = course.modules.reduce((sum, m) => {
              return sum + (moduleProgressMap[m.id] || 0);
            }, 0);
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
    [userId, academyData, saveData, moduleProgressMap],
  );

  const getModuleProgress = useCallback(
    (moduleId: string) => {
      return moduleProgressMap[moduleId] || 0;
    },
    [moduleProgressMap],
  );

  const updateQuizResult = useCallback(
    (moduleId: string, result: QuizResult) => {
      setQuizResultsMap((prev) => ({ ...prev, [moduleId]: result }));
      // Potentially save quiz results to IndexedDB as well if needed
    },
    [],
  );

  const getQuizResult = useCallback(
    (moduleId: string) => {
      return quizResultsMap[moduleId];
    },
    [quizResultsMap],
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
    markModuleProgress,
    getModuleProgress,
    updateQuizResult,
    getQuizResult,
    markCourseVisited,
    markModuleVisited,
  };
};

export default useAcademyStorage;
