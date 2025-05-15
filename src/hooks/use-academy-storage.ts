import { debounce } from 'lodash-es';
import { useEffect, useState } from 'react';

interface QuizResult {
  courseId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
}

interface AcademyData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  quizResults?: QuizResult[];
}

const useAcademyStorage = () => {
  console.log('useAcademyStorage - Running');
  const [academyData, setAcademyData] = useState<AcademyData>(() => {
    if (typeof window !== 'undefined') {
      // Initialize from local storage
      const storedData = localStorage.getItem('academyData');
      try {
        let parsedData = storedData ? JSON.parse(storedData) : { courses: [] };

        // Data validation and versioning
        if (typeof parsedData === 'object' && parsedData !== null) {
          if (!parsedData.version) {
            // If no version, assume it's an older version and initialize
            parsedData = { version: 1, data: parsedData };
          } else if (parsedData.version !== 1) {
            // Handle different versions here (e.g., migration logic)
            console.warn(
              `Local storage data version mismatch. Expected version 1, found version ${parsedData.version}. Resetting.`,
            );
            parsedData = { version: 1, data: {} }; // Reset to a known state
          }
          return parsedData.data;
        } else {
          console.error('Invalid data found in localStorage. Resetting.');
          return {};
        }
      } catch (error) {
        console.error('Error parsing data from localStorage:', error);
        return {}; // Return an empty object in case of an error
      }
    } else {
      return {};
    }
  });

  const debouncedSetItem = debounce((data: AcademyData) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          'academyData',
          JSON.stringify({ version: 1, data }),
        );
      } catch (error) {
        console.error('Error saving data to localStorage:', error);
        // Consider adding more sophisticated error handling,
        // such as retrying or notifying the user.
      }
    }
  }, 500); // Debounce for 500ms

  useEffect(() => {
    debouncedSetItem(academyData);
  }, [academyData]);

  const saveData = (newData: AcademyData) => {
    setAcademyData({ ...newData, courses: newData.courses || [] });
  };

  return { academyData, saveData };
};

export default useAcademyStorage;
