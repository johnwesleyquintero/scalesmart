// lib/indexeddb-service.ts

// --- Constants ---
const DB_NAME = 'scalesmart-db';
const STORE_NAME = 'key-value-store';
const DB_VERSION = 1; // Increment this if you change the schema
const DB_NOT_INITIALIZED_ERROR = 'IndexedDB is not initialized.';

// --- Global State ---
// Stores the database instance once successfully opened.
let db: IDBDatabase | null = null;
// Tracks a pending initialization promise to prevent concurrent initialization.
let initializingPromise: Promise<void> | null = null;

// --- Helper Functions ---

/**
 * Wraps an IndexedDB request into a Promise.
 * Resolves with the request result on success, rejects on error.
 */
function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => {
      console.error(
        'IndexedDB Request Error:',
        (event.target as IDBRequest).error,
      );
      reject((event.target as IDBRequest).error);
    };
  });
}

/**
 * Wraps an IndexedDB transaction into a Promise.
 * Resolves when the transaction completes, rejects if it errors or aborts.
 * Transaction errors/aborts often happen due to request errors within them.
 */
function transactionToPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    // 'oncomplete' is the most reliable signal for a successful transaction.
    transaction.oncomplete = () => resolve();

    // 'onerror' and 'onabort' signal transaction failure.
    // 'onabort' is often triggered by an error on one of the requests.
    transaction.onerror = (event) => {
      console.error(
        'IndexedDB Transaction Error:',
        (event.target as IDBTransaction).error,
      );
      reject(
        (event.target as IDBTransaction).error ||
          new Error('Transaction failed'),
      );
    };
    transaction.onabort = (event) => {
      console.error(
        'IndexedDB Transaction Aborted:',
        (event.target as IDBTransaction).error,
      );
      // Prefer the specific error from event target if available
      reject(
        (event.target as IDBTransaction).error ||
          new Error('Transaction aborted'),
      );
    };
  });
}

// --- Core Initialization Logic ---

/**
 * Initializes the IndexedDB database.
 * Manages concurrent calls to ensure the database is opened only once.
 * Handles database upgrades.
 */
export function initializeDB(): Promise<void> {
  // If already initialized, return a resolved promise.
  if (db) {
    return Promise.resolve();
  }
  // If initialization is already in progress, return the existing promise.
  if (initializingPromise) {
    return initializingPromise;
  }

  // Start a new initialization process.
  initializingPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Handles schema changes when DB_VERSION is incremented.
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        console.log(`Creating object store: ${STORE_NAME}`);
        db.createObjectStore(STORE_NAME);
      }
      // Future schema upgrades for different versions would go here:
      // if (event.oldVersion < 2) { ... create index ... }
      // if (event.oldVersion < 3) { ... add new store ... }
    };

    // Handles successful database connection.
    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      console.log(
        `IndexedDB '${DB_NAME}' (Version ${DB_VERSION}) initialized successfully.`,
      );
      // Clear the promise as initialization is complete.
      initializingPromise = null;
      resolve();
    };

    // Handles errors during database opening.
    request.onerror = (event) => {
      console.error(
        'IndexedDB initialization failed:',
        (event.target as IDBOpenDBRequest).error,
      );
      // Clear the promise as initialization failed.
      initializingPromise = null;
      reject((event.target as IDBOpenDBRequest).error);
    };

    // Handles cases where the database is blocked (e.g., by open connections in other tabs).
    request.onblocked = () => {
      console.warn(
        `IndexedDB open request for '${DB_NAME}' blocked. Please close other tabs or windows using this application.`,
      );
      // For simplicity, we just log. More complex apps might wait or show a UI.
    };
  });

  return initializingPromise;
}

/**
 * Gets the initialized IndexedDB database instance.
 * Awaits initialization if necessary.
 */
async function getDb(): Promise<IDBDatabase> {
  // Ensure initialization completes before returning the db instance.
  // initializeDB handles the concurrency internally.
  await initializeDB();
  // If initializeDB resolved successfully, 'db' should be set.
  // This check is a safeguard.
  if (!db) {
    // This error indicates a logic flaw if initializeDB resolved but db is null.
    throw new Error(DB_NOT_INITIALIZED_ERROR);
  }
  return db;
}

// --- CRUD Operations ---

/**
 * Sets or updates an item in the key-value store.
 */
export async function setItem(key: string, value: unknown): Promise<void> {
  // Get the database instance, ensuring initialization.
  const db = await getDb();
  // Create a transaction with 'readwrite' mode.
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  try {
    // Perform the put request to add/update the item.
    const putRequest = store.put(value, key);

    // Await both the request's success and the transaction's completion.
    // Waiting for the transaction is more robust as it confirms the operation is finalized.
    await Promise.all([
      requestToPromise(putRequest), // Wait for the put request itself
      transactionToPromise(transaction), // Wait for the entire transaction to complete
    ]);

    console.log(`Successfully set item for key: ${key}`);
  } catch (error) {
    console.error(`Failed to set item for key ${key}:`, error);
    // Rethrow the caught error to be handled by the caller.
    throw error;
  }
}

/**
 * Gets an item from the key-value store by key.
 * Returns undefined if the key is not found.
 * @template T The expected type of the retrieved value. Note: IndexedDB stores
 *             data serialized; the 'as T' cast is a runtime assertion and
 *             does not perform runtime type validation.
 */
export async function getItem<T>(key: string): Promise<T | undefined> {
  const db = await getDb();
  // Create a transaction with 'readonly' mode.
  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);

  try {
    // Perform the get request.
    const getRequest = store.get(key);

    // Await the get request result.
    const result = await requestToPromise(getRequest);

    // Wait for the transaction to complete (good practice even for readonly).
    await transactionToPromise(transaction);

    // The 'as T' cast is necessary but unsafe at runtime.
    // The caller is responsible for knowing the expected type.
    console.log(`Successfully retrieved item for key: ${key}`);
    return result as T; // Return the retrieved value, asserted to type T
  } catch (error) {
    console.error(`Failed to get item for key ${key}:`, error);
    // Rethrow the caught error.
    throw error;
  }
}

/**
 * Deletes an item from the key-value store by key.
 */
export async function deleteItem(key: string): Promise<void> {
  const db = await getDb();
  // Create a transaction with 'readwrite' mode.
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  try {
    // Perform the delete request.
    const deleteRequest = store.delete(key);

    // Await both the request's success and the transaction's completion.
    await Promise.all([
      requestToPromise(deleteRequest), // Wait for the delete request
      transactionToPromise(transaction), // Wait for the entire transaction
    ]);

    console.log(`Successfully deleted item for key: ${key}`);
  } catch (error) {
    console.error(`Failed to delete item for key ${key}:`, error);
    // Rethrow the caught error.
    throw error;
  }
}

// --- Optional: Close Function ---
// Add a function to close the database connection if needed (e.g., on app shutdown)
// export function closeDb(): void {
//     if (db) {
//         db.close();
//         db = null;
//         initializingPromise = null; // Reset initialization state
//         console.log(`IndexedDB '${DB_NAME}' connection closed.`);
//     }
// }
