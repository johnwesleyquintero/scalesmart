import { useState, useEffect, useCallback } from 'react';
import { getItem, setItem, removeItem } from '@/lib/indexeddb-service';

// Define a type for the return value of the hook
type UseLocalStorageResult<T> = [
  T | undefined,
  (value: T | ((prevValue: T | undefined) => T)) => void,
  () => void,
  boolean, // Add a boolean to indicate if initial load is complete
];

// Custom hook for persisting state in localStorage (using IndexedDB for persistence)
export function useLocalStorage<T>(
  key: string,
  initialValue: T | undefined,
  serverInitial: T, // Use a third argument for server-side initial value
): UseLocalStorageResult<T> {
  // State to hold the value in the component, initialized with a function
  // to prevent "Maximum update depth exceeded" and ensure initial load from IndexedDB.
  const [storedValue, setStoredValue] = useState<T | undefined>(() => {
    // During server-side rendering or initial client-side render before useEffect,
    // return the serverInitial value.
    if (typeof window === 'undefined') {
      return serverInitial;
    }
    // On the client, attempt to load from IndexedDB synchronously for initial state.
    // This is a common pattern for hooks that read from persistent storage.
    try {
      const storedData = localStorage.getItem(key); // Use localStorage for synchronous read
      return storedData ? JSON.parse(storedData) : initialValue;
    } catch (error) {
      console.error(`Error reading initial value from localStorage for key "${key}":`, error);
      return initialValue;
    }
  });

  const [hasAttemptedInitialLoad, setHasAttemptedInitialLoad] = useState(false);

  // Effect to synchronize state with IndexedDB after initial render
  useEffect(() => {
    const loadFromIndexedDB = async () => {
      try {
        if (typeof window !== 'undefined') {
          const storedData = await getItem<T>(key);
          if (storedData !== undefined) {
            setStoredValue(storedData);
          } else {
            // If no data in IndexedDB, set the initial value
            setStoredValue(initialValue);
            // And persist it to IndexedDB for future loads
            if (initialValue !== undefined) {
              await setItem(key, initialValue);
            }
          }
        }
      } catch (error) {
        console.error(`Error loading from IndexedDB for key "${key}":`, error);
        setStoredValue(initialValue); // Fallback to initialValue on error
      } finally {
        setHasAttemptedInitialLoad(true);
      }
    };

    loadFromIndexedDB();
  }, [key, initialValue]); // Dependencies: key and initialValue

  // Function to store value in IndexedDB
  const setValue: (value: T | ((prevValue: T | undefined) => T)) => void = useCallback(
    (value: T | ((prevValue: T | undefined) => T)) => {
      setStoredValue((prevValue) => {
        const valueToStore = value instanceof Function ? value(prevValue) : value;
        if (typeof window !== 'undefined') {
          try {
            // Persist to IndexedDB
            setItem(key, valueToStore);
            // Also update localStorage for synchronous reads on next component mount
            localStorage.setItem(key, JSON.stringify(valueToStore));
          } catch (error) {
            console.error(`Error saving to IndexedDB for key "${key}":`, error);
          }
        }
        return valueToStore;
      });
    },
    [key], // Dependency: key
  );

  // Function to remove value from IndexedDB
  const removeValue: () => void = useCallback(() => {
    setStoredValue(undefined);
    if (typeof window !== 'undefined') {
      try {
        removeItem(key);
        localStorage.removeItem(key); // Also remove from localStorage
      } catch (error) {
        console.error(`Error removing from IndexedDB for key "${key}":`, error);
      }
    }
  }, [key]); // Dependency: key

  return [storedValue, setValue, removeValue, hasAttemptedInitialLoad];
}
