import { useEffect, useState } from 'react';

interface AcademyData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

const useAcademyStorage = () => {
  console.log('useAcademyStorage - Running');
  const [academyData, setAcademyData] = useState<AcademyData>(() => {
    if (typeof window !== 'undefined') {
      // Initialize from local storage
      const storedData = localStorage.getItem('academyData');
      return storedData ? JSON.parse(storedData) : {};
    } else {
      return {};
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Update local storage when academyData changes
      localStorage.setItem('academyData', JSON.stringify(academyData));
    }
  }, [academyData]);

  const saveData = (newData: AcademyData) => {
    setAcademyData(newData);
  };

  return { academyData, saveData };
};

export default useAcademyStorage;
