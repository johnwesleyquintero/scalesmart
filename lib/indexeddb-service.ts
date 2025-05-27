// lib/indexeddb-service.ts

const DB_NAME = 'my-app-db';
const STORE_NAME = 'key-value-store';
const DB_VERSION = 1; // Increment this if you change the schema
const DB_NOT_INITIALIZED_ERROR = 'IndexedDB is not initialized.';

let db: IDBDatabase | null = null;

export function initializeDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve();
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve();
    };

    request.onerror = (event) => {
      console.error('IndexedDB initialization failed:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

async function getDb(): Promise<IDBDatabase> {
  if (!db) {
    await initializeDB();
    if (!db) {
      throw new Error(DB_NOT_INITIALIZED_ERROR);
    }
  }
  return db;
}

export function setItem(key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    getDb()
      .then((currentDb) => {
        const transaction = currentDb.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(value, key);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = (event) => {
          console.error(`Error setting item ${key}:`, (event.target as IDBRequest).error);
          reject((event.target as IDBRequest).error);
        };
      })
      .catch(reject);
  });
}

export function getItem<T>(key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    getDb()
      .then((currentDb) => {
        const transaction = currentDb.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => {
          resolve(request.result as T);
        };

        request.onerror = (event) => {
          console.error(`Error getting item ${key}:`, (event.target as IDBRequest).error);
          reject((event.target as IDBRequest).error);
        };
      })
      .catch(reject);
  });
}

export function deleteItem(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    getDb()
      .then((currentDb) => {
        const transaction = currentDb.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(key);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = (event) => {
          console.error(`Error deleting item ${key}:`, (event.target as IDBRequest).error);
          reject((event.target as IDBRequest).error);
        };
      })
      .catch(reject);
  });
}
