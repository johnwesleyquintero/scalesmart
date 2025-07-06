import { useState, useEffect, useCallback } from 'react';
import { getItem, setItem, removeCacheItem } from '@/lib/indexeddb-service';

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
    const loadFromIndexedDB = async () => {
      try {
        if (typeof window !== 'undefined') {
          const storedDataFromIndexedDB = await getItem<T>('cache', key);
          setStoredValue(storedDataFromIndexedDB ?? initialValue);
          if (
            initialValue !== undefined &&
            storedDataFromIndexedDB === undefined
          ) {
            await setItem('cache', { key, value: initialValue });
          }
        }
      } catch (error) {
        console.error(
          `[useLocalStorage] Error loading from IndexedDB for key "${key}":`,
          error,
        );
        // Consider a more sophisticated error handling strategy here, e.g., retry, fallback, user notification.
      } finally {
        setIsLoading(false);
      }
    };

    loadFromIndexedDB();
  }, [key, initialValue]);

  const setValue = useCallback(
    (value: T | ((prevValue: T | undefined) => T)) => {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      if (typeof window !== 'undefined') {
        try {
          setItem('cache', { key, value: valueToStore });
        } catch (error) {
          console.error(`Error saving to IndexedDB for key "${key}":`, error);
          // Consider a more sophisticated error handling strategy here, e.g., retry, fallback, user notification.
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
