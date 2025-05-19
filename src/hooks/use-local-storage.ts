import { useState, useEffect, useCallback } from 'react';
// import { getItem, setItem, removeItem } from '@/lib/indexeddb';

// Define a type for the return value of the hook
type UseLocalStorageResult<T> = [
  T | undefined,
  (value: T) => void,
  () => void,
  boolean, // Add a boolean to indicate if initial load is complete
];

// Custom hook for persisting state in localStorage
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  serverInitial: T, // Use a third argument for server-side initial value
): UseLocalStorageResult<T> {
  // State to hold the value in the component
  const [storedValue, setStoredValue] = useState<T | undefined>(serverInitial);
  const [hasAttemptedInitialLoad, setHasAttemptedInitialLoad] = useState(false);

  // Initialize encryption key in localStorage
  useEffect(() => {
    const initializeEncryptionKey = async () => {
      // Check if encryption key exists
      // let key: string | undefined = await getItem<string>('encryptionKey');
      let key: string | undefined = undefined;
      if (!key) {
        // Generate a new encryption key
        key = window.crypto.randomUUID();
        // Store the encryption key in localStorage
        // await setItem('encryptionKey', key);
      }
    };

    initializeEncryptionKey();
  }, []);

  // Function to encrypt data - not used
  // const encryptData = (data: string, encryptionKey: string): string => {
  //   // Simple XOR encryption for demonstration purposes
  //   let encryptedData = '';
  //   for (let i = 0; i < data.length; i++) {
  //     encryptedData += String.fromCharCode(
  //       data.charCodeAt(i) ^ encryptionKey.charCodeAt(i % encryptionKey.length),
  //     );
  //   }
  //   return encryptedData;
  // };

  // Function to decrypt data - not used
  // const decryptData = (data: string, encryptionKey: string): string => {
  //   return encryptData(data, encryptionKey); // Encryption and decryption are the same with XOR
  // };

  // Function to store value in localStorage
  const setValue: (value: T) => void = useCallback(
    (value: T) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        // Save to state
        setStoredValue(valueToStore);
        // Save to local storage
        if (typeof window !== 'undefined') {
          // const encryptionKey = await getItem('encryptionKey') || '';
          // const encryptionKey = '';
          // const dataToStore = JSON.stringify(valueToStore);
          // const encryptedData = encryptData(dataToStore, encryptionKey);
          // await setItem(`${key}_data`, encryptedData);
        }
      } catch (error) {
        // A more advanced implementation would handle the error case
        console.log(error);
      }
    },
    [key, storedValue],
  );

  // Function to remove value from localStorage
  const removeValue: () => void = useCallback(() => {
    try {
      // Remove from state
      setStoredValue(undefined);
      // Remove from local storage
      if (typeof window !== 'undefined') {
        // removeItem(`${key}_data`);
      }
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(error);
    }
  }, [key]);

  useEffect(() => {
    const loadInitialValue = async () => {
      try {
        // Get from local storage by key
        if (typeof window !== 'undefined') {
          // const encryptionKey = await getItem('encryptionKey') || '';
          // const encryptionKey = '';
          // const storedData = await getItem<string>(`${key}_data`);
          const storedData = null;

          if (storedData) {
            // const decryptedData = decryptData(storedData, encryptionKey);
            // const initialValue = JSON.parse(decryptedData);
            // setStoredValue(initialValue);
          } else {
            setStoredValue(initialValue);
          }
        } else {
          setStoredValue(initialValue);
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error);
        setStoredValue(initialValue);
      } finally {
        setHasAttemptedInitialLoad(true);
      }
    };

    loadInitialValue();
  }, [key]);

  return [storedValue, setValue, removeValue, hasAttemptedInitialLoad];
}
