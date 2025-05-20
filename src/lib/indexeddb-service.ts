const DB_NAME = 'scalesmart_db';
const DB_VERSION = 1; // Use a const for the version number

let db: IDBDatabase | null = null;

async function initializeDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB');
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBRequest<IDBDatabase>).result;

      // Create object stores here based on the plan
      if (!db.objectStoreNames.contains('chatMessages')) {
        const chatMessagesStore = db.createObjectStore('chatMessages', {
          keyPath: 'timestamp',
        });
        chatMessagesStore.createIndex('userId', 'userId', { unique: false });
        chatMessagesStore.createIndex('conversationId', 'conversationId', {
          unique: false,
        });
      }

      if (!db.objectStoreNames.contains('workflows')) {
        const workflowsStore = db.createObjectStore('workflows', {
          keyPath: 'workflowId',
        });
        workflowsStore.createIndex('userId', 'userId', { unique: false });
        workflowsStore.createIndex('name', 'name', { unique: false });
      }

      if (!db.objectStoreNames.contains('courses')) {
        const coursesStore = db.createObjectStore('courses', { keyPath: 'id' });
        coursesStore.createIndex('name', 'name', { unique: false });
        coursesStore.createIndex('category', 'category', { unique: false });
      }

      if (!db.objectStoreNames.contains('competitorAnalysis')) {
        const competitorAnalysisStore = db.createObjectStore(
          'competitorAnalysis',
          { keyPath: 'id' },
        );
        competitorAnalysisStore.createIndex('asin', 'asin', { unique: false });
        competitorAnalysisStore.createIndex('timestamp', 'timestamp', {
          unique: false,
        });
      }

      if (!db.objectStoreNames.contains('apiCache')) {
        const apiCacheStore = db.createObjectStore('apiCache', {
          keyPath: 'url',
        });
        apiCacheStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

async function getItem<T>(
  storeName: string,
  key: string,
): Promise<T | undefined> {
  const db = await initializeDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const objectStore = transaction.objectStore(storeName);
    const request = objectStore.get(key);

    request.onerror = () => {
      console.error(`Failed to get item from ${storeName}`);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result as T);
    };
  });
}

async function setItem<T>(
  storeName: string,
  key: string,
  value: T,
): Promise<void> {
  const db = await initializeDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const objectStore = transaction.objectStore(storeName);
    console.log(
      `Attempting to put item in store: ${storeName} with key: ${key}`,
    );

    let keyPath: string | undefined;
    switch (storeName) {
      case 'chatMessages':
        keyPath = 'timestamp';
        break;
      case 'workflows':
        keyPath = 'workflowId';
        break;
      case 'courses':
      case 'competitorAnalysis':
        keyPath = 'id';
        break;
      case 'apiCache':
        keyPath = 'url';
        break;
    }

    if (keyPath && !(value as Record<string, unknown>)[keyPath]) {
      console.error(
        `Key path '${keyPath}' not found in object being saved to ${storeName}`,
      );
      reject(new Error(`Key path '${keyPath}' missing`));
      return;
    }

    const request = objectStore.put(value);

    request.onerror = () => {
      console.error(`Failed to set item in ${storeName}`);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

async function removeItem(storeName: string, key: string): Promise<void> {
  const db = await initializeDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const objectStore = transaction.objectStore(storeName);
    const request = objectStore.delete(key);

    request.onerror = () => {
      console.error(`Failed to remove item from ${storeName}`);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

async function deleteDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.deleteDatabase(DB_NAME);

    request.onerror = () => {
      console.error('Failed to delete database');
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('Database deleted successfully');
      resolve();
    };
  });
}
async function getAllWorkflows(): Promise<Workflow[]> {
  const db = await initializeDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('workflows', 'readonly');
    const objectStore = transaction.objectStore('workflows');
    const request = objectStore.getAll();

    request.onerror = () => {
      console.error('Failed to get all workflows');
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result as Workflow[]);
    };
  });
}

export interface Workflow {
  workflowId: string;
  nodes: unknown[];
  edges: unknown[];
}

export {
  initializeDB,
  getItem,
  setItem,
  removeItem,
  deleteDatabase,
  getAllWorkflows,
};
