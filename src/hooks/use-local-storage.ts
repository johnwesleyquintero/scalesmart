import { useState } from 'react';

export const useLocalStorage = <T>(
  key: string,
  initialValue: T,
  serverValue: T,
) => {
  const getInitialValue = () => {
    if (typeof window === 'undefined') {
      return serverValue;
    }
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(getInitialValue);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error setting localStorage key:\n', error);
    }
  };

  return [storedValue, setValue] as const;
};
