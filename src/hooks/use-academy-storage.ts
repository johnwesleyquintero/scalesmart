import { useToast } from '@/hooks/use-toast';
import { Course } from '@/types';
import { useCallback } from 'react';
import useAcademyStorageService from '@/lib/academy-storage-service';

// It's good practice to define types for your data structures.
// If 'Course' is defined elsewhere, you might want to import it.
// For now, here's a basic definition:

export interface AcademyDataType {
  courses: Course[];
  // You can add other top-level properties to academyData here if needed
  // e.g., userPreferences?: Record<string, any>;
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
          // Ensure courses is always an array, merging updates correctly
          const newCourses =
            updates.courses !== undefined
              ? updates.courses
              : currentData.courses;
          return {
            ...currentData,
            ...updates,
            courses: newCourses || [], // Fallback to empty array if newCourses is null/undefined
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

  return { academyData, saveData };
};

export default useAcademyStorage;
