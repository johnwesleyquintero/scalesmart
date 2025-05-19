import { useLocalStorage } from '@/hooks/use-local-storage';
import { AcademyDataType } from '@/hooks/use-academy-storage';

const ACADEMY_DATA_KEY = 'academyData';

const useAcademyStorageService = () => {
  const [academyData, setAcademyData] = useLocalStorage<AcademyDataType>(
    ACADEMY_DATA_KEY,
    { courses: [], moduleProgress: {}, quizResults: {} },
    { courses: [], moduleProgress: {}, quizResults: {} },
  );

  const getAcademyData = () => academyData;

  const setAcademyDataValue = (
    value: AcademyDataType | ((val: AcademyDataType) => AcademyDataType),
  ) => {
    setAcademyData(
      typeof value === 'function'
        ? value(
            academyData ?? { courses: [], moduleProgress: {}, quizResults: {} },
          )
        : value,
    );
  };

  const exportAcademyData = () => {
    return JSON.stringify(academyData);
  };

  return { getAcademyData, setAcademyDataValue, exportAcademyData };
};

export default useAcademyStorageService;
