import CryptoJS from 'crypto-js';
import DOMPurify from 'dompurify';
import lzstring from 'lz-string';
import { useEffect, useState } from 'react';
import { useToast } from './use-toast'; // Import useToast

const generateEncryptionKey = () => {
  if (typeof window === 'undefined') {
    return ''; // Or some default value, but encryption won't work server-side
  }

  let key = sessionStorage.getItem('encryptionKey');
  if (!key) {
    key = window.crypto.randomUUID(); // Generate a unique key
    sessionStorage.setItem('encryptionKey', key);
  }
  return key;
};

const SECRET_KEY = generateEncryptionKey();

const CAN_ENCRYPT = !!SECRET_KEY;

if (!CAN_ENCRYPT) {
  console.warn(
    'No encryption key available. Data will be stored unencrypted in local storage. Ensure this is acceptable for the data being stored.',
  );
}

const CHUNK_SIZE = 100000; // Adjust chunk size as needed

const compress = (data: string) => {
  return lzstring.compress(data);
};

const decompress = (compressedData: string) => {
  return lzstring.decompress(compressedData);
};

const chunkString = (str: string, size: number) => {
  const numChunks = Math.ceil(str.length / size);
  const chunks = new Array(numChunks);

  for (let i = 0, c = 0; i < numChunks; ++i, c += size) {
    chunks[i] = str.slice(c, c + size);
  }

  return chunks;
};

const cache: { [key: string]: unknown } = {};

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  serverValue: T,
) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const { toast } = useToast(); // Get the toast function

  // Moved sanitizeValue here to be accessible by both useEffect and setValue
  const sanitizeValue = (value: T): T => {
    if (typeof value === 'string') return DOMPurify.sanitize(value) as T;
    if (typeof value === 'object' && value !== null)
      return JSON.parse(DOMPurify.sanitize(JSON.stringify(value))) as T;
    return value;
  };

  useEffect(() => {
    const getInitialValue = async () => {
      if (typeof window === 'undefined') {
        return serverValue;
      }

      // Check if the value is in the cache
      if (cache[key]) {
        console.log('Reading data from cache for key:', key);
        return cache[key] as T;
      }

      return readFromLocalStorage(key, initialValue);
    };

    const readFromLocalStorage = async (
      key: string,
      initialValue: T,
    ): Promise<T> => {
      console.log('Reading data from local storage for key:', key);
      try {
        const combinedData = retrieveAndCombineChunks(key);

        if (!combinedData) return initialValue;

        const decompressedData = decompress(combinedData);
        if (!decompressedData) {
          console.warn(
            'Decompression failed for key:',
            key,
            '. Returning initial value.',
          );
          return initialValue;
        }

        const decrypted = decryptData(decompressedData, key);
        if (!decrypted) return initialValue;

        const parsedValue = parseAndSanitize(decrypted, key);
        if (parsedValue === undefined) return initialValue;

        return parsedValue;
      } catch (error) {
        console.error('Error getting or decrypting localStorage key:', error);
        return initialValue;
      } finally {
        console.log('Finished reading data from local storage for key:', key);
      }
    };

    const retrieveAndCombineChunks = (key: string): string => {
      const chunkKeys = Object.keys(localStorage)
        .filter((k) => k.startsWith(`${key}_chunk`))
        .sort();
      return chunkKeys.map((k) => localStorage.getItem(k) || '').join('');
    };

    const decryptData = (data: string, key: string): string | null => {
      try {
        const decrypted = CAN_ENCRYPT
          ? CryptoJS.AES.decrypt(data, SECRET_KEY).toString(CryptoJS.enc.Utf8)
          : data;

        if (!decrypted) {
          console.warn(
            'Decryption failed for key:',
            key,
            '. Returning initial value.',
          );
          return null;
        }

        return decrypted;
      } catch (decryptionError) {
        console.error(
          `Decryption error for localStorage key "${key}":`,
          decryptionError,
        );
        console.warn(
          `Malformed UTF-8 data encountered for key "${key}". Clearing the item from localStorage.`,
        );
        Object.keys(localStorage)
          .filter((k) => k.startsWith(`${key}_chunk`))
          .forEach((k) => localStorage.removeItem(k));
        return null;
      }
    };

    const parseAndSanitize = (
      decrypted: string,
      key: string,
    ): T | undefined => {
      try {
        const parsedValue = JSON.parse(decrypted) as T;
        return sanitizeValue(parsedValue);
      } catch (parseError) {
        console.error('Error parsing decrypted JSON:', parseError);
        Object.keys(localStorage)
          .filter((k) => k.startsWith(`${key}_chunk`))
          .forEach((k) => localStorage.removeItem(k));
        return undefined;
      }
    };

    getInitialValue().then((value) => {
      setStoredValue(value);
      cache[key] = value;
    });
  }, [key, serverValue]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue as T) : value;

      const sanitizedValue = sanitizeValue(valueToStore);

      const stringifiedValue = JSON.stringify(sanitizedValue);

      // Encrypt the data
      let dataToCompress: string;
      if (!CAN_ENCRYPT) {
        dataToCompress = stringifiedValue; // Store unencrypted
      } else {
        dataToCompress = CryptoJS.AES.encrypt(
          stringifiedValue,
          SECRET_KEY,
        ).toString();
      }

      const compressedData = compress(dataToCompress);

      const chunks = chunkString(compressedData, CHUNK_SIZE);

      // Clear existing chunks
      Object.keys(localStorage)
        .filter((k) => k.startsWith(`${key}_chunk`))
        .forEach((chunkKey) => localStorage.removeItem(chunkKey));

      // Store data in chunks
      console.log(
        'Writing data to local storage for key:',
        key,
        'value:',
        valueToStore,
      );
      chunks.forEach((chunk, index) => {
        localStorage.setItem(`${key}_chunk${index}`, chunk);
      });

      setStoredValue(valueToStore);
      cache[key] = valueToStore; // Update the cache
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.error('LocalStorage quota exceeded:', error);
        toast({
          title: 'Storage Full',
          description:
            'Cannot save data. Local storage is full. Please clear some space or contact support.',
        });
      } else {
        console.error('Error setting or encrypting localStorage key:\n', error);
        toast({
          title: 'Storage Error',
          description:
            'Could not save data to local storage. Please try again.',
        });
      }
    } finally {
      console.log('Finished writing data to local storage for key:', key);
    }
  };

  return [storedValue, setValue] as const;
}
