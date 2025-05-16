import CryptoJS from 'crypto-js';
import DOMPurify from 'dompurify';
import lzstring from 'lz-string';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useToast } from './use-toast'; // Import useToast

// Helper function to get encryption configuration, ensuring client-side evaluation for key generation.
const getEncryptionConfig = (() => {
  let clientWarningEmitted = false; // Closure to ensure warning is emitted only once per client session

  return () => {
    if (typeof window === 'undefined') {
      // Server-side context or during build; encryption is not applicable here.
      return { secretKey: '', canEncrypt: false, isClientContext: false };
    }

    let key = sessionStorage.getItem('encryptionKey');
    if (!key) {
      try {
        key = window.crypto.randomUUID();
        sessionStorage.setItem('encryptionKey', key);
      } catch (e) {
        console.error(
          'Failed to generate/store encryption key in sessionStorage:',
          e,
        );
        key = null; // Ensure key is null if generation/storage failed
      }
    }
    const canEncrypt = !!key;
    if (!canEncrypt && !clientWarningEmitted) {
      console.warn(
        'Client: Could not establish an encryption key. Data will be stored unencrypted in local storage. Ensure this is acceptable.',
      );
      clientWarningEmitted = true;
    }
    return { secretKey: key || '', canEncrypt, isClientContext: true };
  };
})();

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
  const { toast } = useToast();
  const serverValueRef = useRef(serverValue);

  const sanitizeValue = useCallback((value: T): T => {
    if (typeof value === 'string') {
      // Check if the string contains HTML tags
      if (/<[^>]*>/g.test(value)) {
        return DOMPurify.sanitize(value) as T;
      }
      return value;
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.parse(DOMPurify.sanitize(JSON.stringify(value))) as T;
    }
    return value;
  }, []);

  useEffect(() => {
    if (serverValueRef.current !== serverValue) {
      serverValueRef.current = serverValue;
    }

    const getInitialValue = async () => {
      if (typeof window === 'undefined') {
        return serverValueRef.current;
      }

      // Check if the value is in the cache
      if (cache[key]) {
        console.log('Reading data from cache for key:', key);
        return cache[key] as T;
      }

      // Define these helpers inside or memoize if they were outside and used sanitizeValue
      const retrieveAndCombineChunks = (k: string): string => {
        const chunkKeys = Object.keys(localStorage)
          .filter((chunkKey) => chunkKey.startsWith(`${k}_chunk`))
          .sort();
        return chunkKeys
          .map((chunkKey) => localStorage.getItem(chunkKey) || '')
          .join('');
      };
      const decryptData = (data: string, k: string): string | null => {
        const { secretKey, canEncrypt: clientCanEncrypt } =
          getEncryptionConfig();
        try {
          // Only attempt decryption if on client and encryption is possible
          const decrypted = clientCanEncrypt
            ? CryptoJS.AES.decrypt(data, secretKey).toString(CryptoJS.enc.Utf8)
            : data;
          if (!decrypted && clientCanEncrypt) {
            // Warn if decryption was attempted and failed
            console.warn(
              'Decryption failed for key:',
              k,
              '. Returning initial value.',
            );
            return null;
          }
          return decrypted;
        } catch (decryptionError) {
          console.error(
            `Decryption error for localStorage key "${k}" (data might be corrupted or key changed):`,
            decryptionError,
          );
          Object.keys(localStorage)
            .filter((chunkKey) => chunkKey.startsWith(`${k}_chunk`))
            .forEach((chunkKey) => localStorage.removeItem(chunkKey)); // Clear corrupted data
          return null;
        }
      };
      const parseAndSanitizeInternal = (
        decrypted: string,
        k: string,
      ): T | undefined => {
        try {
          const parsedValue = JSON.parse(decrypted) as T;
          return sanitizeValue(parsedValue); // Use memoized sanitizeValue
        } catch (parseError) {
          console.error('Error parsing decrypted JSON:', parseError);
          Object.keys(localStorage)
            .filter((chunkKey) => chunkKey.startsWith(`${k}_chunk`))
            .forEach((chunkKey) => localStorage.removeItem(chunkKey)); // Clear corrupted data
          return undefined;
        }
      };

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

        const parsedValue = parseAndSanitizeInternal(decrypted, key);
        if (parsedValue === undefined) return initialValue;

        return parsedValue;
      } catch (error) {
        console.error('Error getting or decrypting localStorage key:', error);
        return initialValue;
      } finally {
        console.log('Finished reading data from local storage for key:', key);
      }
    };

    getInitialValue().then((value) => {
      // Add this check to prevent unnecessary state updates
      if (value !== storedValue) {
        setStoredValue(value);
        cache[key] = value;
      }
    });
  }, [key, initialValue, serverValue, sanitizeValue, storedValue]); // Ensure initialValue and serverValue are stable if objects/arrays

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Use functional update with setStoredValue to get the latest storedValue
        // and avoid needing storedValue in useCallback's dependency array.
        setStoredValue((currentStoredValue) => {
          const valueToStore =
            value instanceof Function ? value(currentStoredValue) : value;

          const sanitized = sanitizeValue(valueToStore); // Use memoized sanitizeValue
          const stringifiedValue = JSON.stringify(sanitized);
          const {
            secretKey,
            canEncrypt: clientCanEncrypt,
            isClientContext,
          } = getEncryptionConfig();

          let dataToCompress: string;
          if (isClientContext && !clientCanEncrypt) {
            // On client, but cannot encrypt (e.g., sessionStorage failed)
            console.warn(
              `Storing data for key "${key}" unencrypted as client-side encryption is not available.`,
            );
            dataToCompress = stringifiedValue;
          } else if (!isClientContext) {
            // Not in a client context (e.g. SSR), store unencrypted
            dataToCompress = stringifiedValue;
          } else {
            dataToCompress = CryptoJS.AES.encrypt(
              stringifiedValue,
              secretKey,
            ).toString(); // Encrypt on client
          }

          const compressedData = compress(dataToCompress);
          const chunks = chunkString(compressedData, CHUNK_SIZE);

          Object.keys(localStorage)
            .filter((k) => k.startsWith(`${key}_chunk`))
            .forEach((chunkKey) => localStorage.removeItem(chunkKey));

          chunks.forEach((chunk, index) => {
            localStorage.setItem(`${key}_chunk${index}`, chunk);
          });

          cache[key] = valueToStore; // Update the cache
          return valueToStore; // Return the new value for setStoredValue
        });
      } catch (error) {
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          console.error('LocalStorage quota exceeded:', error);
          toast({
            title: 'Storage Full',
            description:
              'Cannot save data. Local storage is full. Please clear some space or contact support.',
          });
        } else {
          console.error(
            'Error setting or encrypting localStorage key:\n',
            error,
          );
          toast({
            title: 'Storage Error',
            description:
              'Could not save data to local storage. Please try again.',
          });
        }
      } finally {
        console.log('Finished writing data to local storage for key:', key);
      }
    },
    [key, toast, sanitizeValue],
  ); // SECRET_KEY & CAN_ENCRYPT are module scope constants

  return [storedValue, setValue] as const;
}
