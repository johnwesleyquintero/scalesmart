import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';
import { Course } from '@/types';

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
  const [academyData, setAcademyData] = useLocalStorage<AcademyDataType>(
    'academyData',
    { courses: [] }, // Initial value for the client
    { courses: [] }, // Default server value (used during SSR or if localStorage is unavailable)
  );

  const saveData = (updates: Partial<AcademyDataType>) => {
    try {
      setAcademyData((currentData) => {
        // Ensure courses is always an array, merging updates correctly
        const newCourses =
          updates.courses !== undefined ? updates.courses : currentData.courses;
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
    } catch (error) {
      console.error('Failed to save academy data:', error);
      toast({
        title: 'Error',
        description: 'Could not save academy data. Please try again.',
      });
    }
  };

  return { academyData, saveData };
};

export default useAcademyStorage;
