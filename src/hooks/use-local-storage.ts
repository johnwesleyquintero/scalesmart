import { useState, useEffect, useCallback } from 'react';
import {
  getCacheItem,
  setCacheItem,
  removeCacheItem,
} from '@/lib/localstorage-service';

type UseLocalStorageResult<T> = [
  T | undefined,
  (value: T | ((prevValue: T | undefined) => T)) => void,
  () => void,
  boolean, // isLoading
];

export function useLocalStorage<T>(
  key: string,
  initialValue: T | undefined,
): UseLocalStorageResult<T> {
  const [storedValue, setStoredValue] = useState<T | undefined>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFromLocalStorage = async () => {
      try {
        if (typeof window !== 'undefined') {
          const storedData = await getCacheItem<T>(key);

          setStoredValue(storedData ?? initialValue);
          if (initialValue !== undefined && storedData === undefined) {
            await setCacheItem(key, initialValue);
          }
        }
      } catch (error) {
        console.error(
          `[useLocalStorage] Error loading from localStorage for key "${key}":`,
          error,
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadFromLocalStorage();
  }, [key, initialValue]);

  const setValue = useCallback(
    (value: T | ((prevValue: T | undefined) => T)) => {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      if (typeof window !== 'undefined') {
        try {
          setCacheItem(key, valueToStore);
        } catch (error) {
          console.error(
            `Error saving to localStorage for key "${key}":`,
            error,
          );
        }
      }
      setStoredValue(valueToStore);
    },
    [key, storedValue], // Added storedValue to dependencies for correct function(prevValue) behavior
  );

  const removeValue = useCallback(() => {
    setStoredValue(undefined);
    if (typeof window !== 'undefined') {
      try {
        removeCacheItem(key);
      } catch (error) {
        console.error(`Error removing from IndexedDB for key "${key}":`, error);
        // Consider a more sophisticated error handling strategy here, e.g., retry, fallback, user notification.
      }
    }
  }, [key]);

  return [storedValue, setValue, removeValue, !isLoading];
}
