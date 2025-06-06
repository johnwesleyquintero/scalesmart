import { useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { AcademyDataType } from '@/hooks/use-academy-storage';

const ACADEMY_DATA_KEY = 'academyData';

const useAcademyStorageService = () => {
  const [academyData, setAcademyData] = useLocalStorage<AcademyDataType>(
    ACADEMY_DATA_KEY,
    { courses: [] }, // Updated initial state
    { courses: [] }, // Updated default value
  );

  const getAcademyData = useCallback(() => academyData, [academyData]);

  const setAcademyDataValue = useCallback(
    (value: AcademyDataType | ((val: AcademyDataType) => AcademyDataType)) => {
      setAcademyData(
        typeof value === 'function'
          ? value(academyData ?? { courses: [] }) // Updated fallback value
          : value,
      );
    },
    [setAcademyData, academyData],
  );

  const exportAcademyData = useCallback(() => {
    return JSON.stringify(academyData);
  }, [academyData]);

  return { getAcademyData, setAcademyDataValue, exportAcademyData };
};

export default useAcademyStorageService;
