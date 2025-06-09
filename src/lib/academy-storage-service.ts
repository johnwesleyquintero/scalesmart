import { useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { AcademyDataType } from '@/hooks/use-academy-storage';

const ACADEMY_DATA_KEY = 'academyData';

const useAcademyStorageService = (key: string = ACADEMY_DATA_KEY) => {
  const [academyData, setAcademyData] = useLocalStorage<AcademyDataType>(
    key,
    { courses: [] },
    { courses: [] },
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
    const dataStr = JSON.stringify(academyData);
    const dataUri =
      'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', 'academyData.json');
    document.body.appendChild(link); // Required for FF
    link.click();
    link.remove();
  }, [academyData]);

  return { getAcademyData, setAcademyDataValue, exportAcademyData };
};

export default useAcademyStorageService;
