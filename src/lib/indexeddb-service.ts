import { SupabaseClient } from '@supabase/supabase-js'; // Import SupabaseClient type
import type { CampaignData } from 'lib/amazon-tools/metrics';

// --- Types ---
/**
 * Represents the data structure for calculation entries,
 * often mirroring CampaignData in the context of ACOS calculations.
 */
export type CalculationData = CampaignData;

// lib/indexeddb-service.ts - Trivial change to force re-evaluation

// --- Constants ---
const DB_NAME = 'scalesmart-db';
const MAIN_STORE_NAME = 'key-value-store'; // Renamed for clarity
const SYNC_QUEUE_STORE_NAME = 'sync-queue'; // Added constant for sync queue store name
const METADATA_STORE_NAME = 'metadata-store'; // New constant for metadata store
const CHAT_MESSAGES_STORE_NAME = 'chat-messages'; // Add this constant
const DB_VERSION = 3; // Increment this if you change the schema
const DB_NOT_INITIALIZED_ERROR = 'IndexedDB is not initialized.';

// --- Types ---
interface SyncQueueItem {
  id?: number; // IndexedDB auto-incremented key
  type: 'set' | 'delete';
  tableName: string;
  recordId: string; // The ID of the record in the Supabase table
  value?: unknown; // The full record data for 'set' operations
  timestamp: number;
}

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
        'Details:',
        (event.target as IDBRequest).error?.message,
        (event.target as IDBRequest).error?.stack,
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
  console.log(`Transaction ${transaction.mode} started.`);
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      console.log(`Transaction ${transaction.mode} completed successfully.`);
      resolve();
    };

    transaction.onerror = (event) => {
      const error = (event.target as IDBTransaction).error;
      console.error(
        `IndexedDB Transaction Error (${transaction.mode}):`,
        error,
        'Details:',
        error?.message,
        error?.stack,
      );
      reject(error || new Error(`Transaction failed (${transaction.mode})`));
    };

    transaction.onabort = (event) => {
      const error = (event.target as IDBTransaction).error;
      console.error(
        `IndexedDB Transaction Aborted (${transaction.mode}):`,
        error,
        'Details:',
        error?.message,
        error?.stack,
      );
      reject(error || new Error(`Transaction aborted (${transaction.mode})`));
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
      if (!db.objectStoreNames.contains(MAIN_STORE_NAME)) {
        console.log(`Creating object store: ${MAIN_STORE_NAME}`);
        db.createObjectStore(MAIN_STORE_NAME);
      }
      // Create a store for tracking changes to sync with Supabase
      if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE_NAME)) {
        console.log(`Creating object store: ${SYNC_QUEUE_STORE_NAME}`);
        // The sync-queue will store objects describing the change (type, table, recordId, value)
        db.createObjectStore(SYNC_QUEUE_STORE_NAME, { autoIncrement: true });
      }

      // Upgrade logic for version 2: Ensure sync-queue exists
      if (event.oldVersion < 2) {
        if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE_NAME)) {
          console.log(
            `Creating object store: ${SYNC_QUEUE_STORE_NAME} during upgrade.`,
          );
          db.createObjectStore(SYNC_QUEUE_STORE_NAME, { autoIncrement: true });
        }
      }

      // Upgrade logic for version 3: Add metadata store and chat-messages store
      if (event.oldVersion < 3) {
        if (!db.objectStoreNames.contains(METADATA_STORE_NAME)) {
          console.log(
            `Creating object store: ${METADATA_STORE_NAME} during upgrade.`,
          );
          db.createObjectStore(METADATA_STORE_NAME); // Key-value store for metadata
        }
        // Add chat-messages store
        if (!db.objectStoreNames.contains(CHAT_MESSAGES_STORE_NAME)) {
          // Use the constant
          console.log(
            `Creating object store: ${CHAT_MESSAGES_STORE_NAME} during upgrade.`,
          );
          db.createObjectStore(CHAT_MESSAGES_STORE_NAME);
        }
       if (!db.objectStoreNames.contains('academy-module-progress')) {
           console.log(`Creating object store: academy-module-progress`);
           db.createObjectStore('academy-module-progress');
       }
      }
      // Future schema upgrades for different versions would go here:
      // if (event.oldVersion < 4) { ... add new store ... }
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
      const error = (event.target as IDBOpenDBRequest).error;
      console.error(
        'IndexedDB initialization failed:',
        error,
        'Details:',
        error?.message,
        error?.stack,
      );
      // Clear the promise as initialization failed.
      initializingPromise = null;
      reject(error);
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
 * Sets or updates an item in the key-value store and adds it to the sync queue.
 * @param tableName The name of the Supabase table this item corresponds to.
 * @param recordId The ID of the record in the Supabase table.
 * @param value The data to store.
 */
export async function setItem(
  tableName: string,
  recordId: string,
  value: unknown,
): Promise<void> {
  // Get the database instance, ensuring initialization.
  const db = await getDb();
  // Create a transaction with 'readwrite' mode for both stores.
  const key = `${tableName}-${recordId}`; // Consistent key format
  const transaction = db.transaction(
    [MAIN_STORE_NAME, SYNC_QUEUE_STORE_NAME],
    'readwrite',
  );
  console.log(`setItem: Transaction created for key: ${key}`);
  const mainStore = transaction.objectStore(MAIN_STORE_NAME);
  const syncStore = transaction.objectStore(SYNC_QUEUE_STORE_NAME);

  try {
    // Perform the put request to add/update the item in the main store.
    const putRequest = mainStore.put(value, key);

    // Add change to sync queue
    const change = {
      type: 'set',
      tableName: tableName,
      recordId: recordId,
      value: value, // Store the full value for 'set'
      timestamp: Date.now(),
    };
    const addSyncRequest = syncStore.add(change);

    // Await both requests and the transaction's completion.
    await Promise.all([
      requestToPromise(putRequest),
      requestToPromise(addSyncRequest),
      transactionToPromise(transaction), // Wait for the entire transaction to complete
    ]);

    console.log(
      `Successfully set item for key: ${key} and added to sync queue.`,
    );
  } catch (error) {
    console.error(
      `Failed to set item for key ${key}:`,
      error,
      'Details:',
      (error as Error)?.message,
      (error as Error)?.stack,
    );
    // Rethrow the caught error to be handled by the caller.
    throw error;
  }
}

/**
 * Pushes changes from the sync queue to Supabase.
 * @param supabaseClient The Supabase client instance.
 */
export async function syncToSupabase(
  supabaseClient: SupabaseClient,
): Promise<void> {
  try {
    if (!db.isOpen()) {
      try {
        await db.open();
        console.log(DB_INITIALIZED);
      } catch (openError) {
        console.error(DB_OPEN_FAILED, openError);
        throw openError;
      }
    } else {
      console.log(DB_ALREADY_OPEN);
    }
  } catch (error) {
    console.error(
      `${ERROR_MESSAGE_PREFIX}: Failed to initialize ChatAppDatabase`,
      error,
    );
    throw error;
  }
};

    // Open a cursor to iterate through the sync queue
    const cursorRequest = store.openCursor();

    await new Promise<void>((resolve, reject) => {
      cursorRequest.onsuccess = async (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>)
          .result;
        if (cursor) {
          const change = cursor.value as SyncQueueItem; // Cast to the expected type
          await processSyncQueueItem(change, supabaseClient, cursor); // Call the new helper function
          cursor.continue(); // Move to the next entry
        } else {
          // No more entries in the cursor
          resolve();
        }
      };

      cursorRequest.onerror = (event) => {
        console.error(
          'Error opening cursor for sync queue:',
          (event.target as IDBRequest).error,
        );
        reject((event.target as IDBRequest).error);
      };
    });

    await transactionToPromise(transaction);
    console.log('Finished syncing changes to Supabase.');
  } catch (error) {
    console.error(
      'Failed to sync to Supabase:',
      error,
      'Details:',
      (error as Error)?.message,
      (error as Error)?.stack,
    );
    throw error;
  }
}

/**
 * Processes a single item from the sync queue.
 * @param change The sync queue item to process.
 * @param supabaseClient The Supabase client instance.
 * @param cursor The IndexedDB cursor for the sync queue.
 */
async function processSyncQueueItem(
  change: SyncQueueItem,
  supabaseClient: SupabaseClient,
  cursor: IDBCursorWithValue,
): Promise<void> {
  console.log('Processing sync queue entry:', change);

  try {
    const { type, tableName, recordId, value } = change;

    if (!tableName || recordId === undefined) {
      console.error(
        'Invalid sync queue entry: missing tableName or recordId',
        change,
      );
      cursor.continue(); // Skip this entry and continue
      return;
    }

    switch (type) {
      case 'set': {
        // Represents both create and update
        // Use upsert with the explicit recordId
        const { data, error } = await supabaseClient
          .from(tableName)
          .upsert([value], { onConflict: 'id' }); // Assuming 'id' is the conflict key

        if (error) {
          console.error(
            `Error syncing 'set' change for ${tableName}/${recordId}:`,
            error,
          );
          // Log more details about the error
          console.error(
            `Supabase 'set' error details:`,
            error?.message,
            error?.details,
            error?.hint,
            error?.code,
          );
          // Depending on conflict resolution strategy, you might retry or log and skip
          // For now, we log and continue to the next entry
        } else {
          console.log(
            `Successfully synced 'set' change for ${tableName}/${recordId}.`,
            'Supabase response data:',
            data,
          );
          cursor.delete(); // Remove the entry from the sync queue after successful sync
        }
        break;
      } // End case 'set' block
      case 'delete': {
        // Use delete with the explicit recordId
        const { error: deleteError } = await supabaseClient
          .from(tableName)
          .delete()
          .eq('id', recordId); // Assuming 'id' is the primary key field

        if (deleteError) {
          console.error(
            `Error syncing 'delete' change for ${tableName}/${recordId}:`,
            deleteError,
          );
          // Log more details about the error
          console.error(
            `Supabase 'delete' error details:`,
            deleteError?.message,
            deleteError?.details,
            deleteError?.hint,
            deleteError?.code,
          );

          // If the record was already deleted on Supabase (PGRST116), treat as success.
          // Otherwise, log error and leave in queue for retry.
          if (deleteError.code === 'PGRST116') {
            console.log(
              `Record ${tableName}/${recordId} already not found on Supabase. Removing from sync queue.`,
            );
            cursor.delete(); // Remove the entry from the sync queue
          } else {
            // Log and keep the item in the queue for retry
          }
        } else {
          console.log(
            `Successfully synced 'delete' change for ${tableName}/${recordId}.`,
          );
          cursor.delete(); // Remove the entry from the sync queue after successful sync
        }
        break;
      } // End case 'delete' block
      default:
        console.warn('Unknown change type in sync queue:', type, change);
        cursor.delete(); // Remove unknown entries to prevent blocking
    }
  } catch (syncError) {
    console.error(
      'Error processing sync queue entry:',
      syncError,
      'Entry:',
      change,
      'Details:',
      (syncError as Error)?.message,
      (syncError as Error)?.stack,
=======
    if (!db.isOpen()) {
      try {
        await db.open();
        console.log(DB_INITIALIZED);
      } catch (openError) {
        console.error(DB_OPEN_FAILED, openError);
        throw openError;
      }
    } else {
      console.log(DB_ALREADY_OPEN);
    }
  } catch (error) {
    console.error(
      `${ERROR_MESSAGE_PREFIX}: Failed to initialize ChatAppDatabase`,
      error,
    );
    throw error;
  }
};

export const getChatMessagesBySession = async (
  chatSessionId: string,
): Promise<ChatMessageRecord[]> => {
  try {
    return await db.chatMessages
      .where('chatSessionId')
      .equals(chatSessionId)
      .sortBy('timestamp');
  } catch (error) {
    console.error(
      `${ERROR_MESSAGE_PREFIX}: Failed to get messages for session ${chatSessionId}`,
      error,
    );
    return [];
  }
};

function logError(error: unknown, message: string, component: string) {
  console.error(`${component}: ${message}`, error);
}

export async function getCacheItem<T>(key: string): Promise<T | undefined> {
  try {
    return (await db.cache.get(key).then((item) => item?.value)) as
      | T
      | undefined;
  } catch (error) {
    console.error(
      `${ERROR_MESSAGE_PREFIX}: Error getting item from cache with key "${key}"`,
      error,
    );
    // Log the error but continue processing other entries
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
  const transaction = db.transaction([MAIN_STORE_NAME], 'readonly');
  console.log(`getItem: Transaction created for key: ${key}`);
  const store = transaction.objectStore(MAIN_STORE_NAME);

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
    console.error(
      `${ERROR_MESSAGE_PREFIX}: Error saving calculation to IndexedDB for campaign "${data.campaignName}"`,
      error,
=======
      `${ERROR_MESSAGE_PREFIX}: Error saving calculation to IndexedDB for campaign "${data.campaignName}"`,
      error,
    );
    // Rethrow the caught error.
    throw error;
  }
}

export async function setCacheItem<T>(key: string, value: T): Promise<void> {
  try {
    await db.cache.put({ key: key, value: value });
  } catch (error) {
    console.error(
      `${ERROR_MESSAGE_PREFIX}: Error setting item in cache with key "${key}"`,
      error,
    );
  }
}
=======
export async function setCacheItem<T>(key: string, value: T): Promise<void> {
  try {
    await db.cache.put({ key: key, value: value });
  } catch (error) {
    console.error(
      `${ERROR_MESSAGE_PREFIX}: Error setting item in cache with key "${key}"`,
      error,
    );
  }
}
>>>>>>> parent of a46766c (refactor(project-management): remove unused props and improve error handling)

  try {
    // Perform the delete request from the main store.
    const deleteRequest = mainStore.delete(key);

    // Add change to sync queue
    const change = {
      type: 'delete',
      tableName: tableName,
      recordId: recordId,
      timestamp: Date.now(),
    };
    const addSyncRequest = syncStore.add(change);

    // Await both requests and the transaction's completion.
    await Promise.all([
      requestToPromise(deleteRequest),
      requestToPromise(addSyncRequest),
      transactionToPromise(transaction), // Wait for the entire transaction
    ]);

    console.log(
      `Successfully deleted item for key: ${key} and added to sync queue.`,
    );
  } catch (error) {
    console.error(
      `Failed to delete item for key ${key}:`,
      error,
      'Details:',
      (error as Error)?.message,
      (error as Error)?.stack,
    );
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

/**
 * Fetches all items from a given IndexedDB store.
 * This is a generic helper for retrieving all records when specific keys are not known.
 * @param storeName The name of the object store.
 * @returns A promise that resolves to an array of all items in the store.
 */
export async function getAllItemsFromStore<T>(storeName: string): Promise<T[]> {
  const db = await getDb();

  // Check if the object store exists before creating a transaction
  if (!db.objectStoreNames.contains(storeName)) {
    const error = new Error(
      `IndexedDB Error: Object store "${storeName}" not found.`,
    );
    console.error(error.message, error.stack);
    throw error;
  }

  const transaction = db.transaction([storeName], 'readonly');
  const store = transaction.objectStore(storeName);
  const request = store.getAll();
  return new Promise((resolve, reject) => {
    try {
      request.onsuccess = () => resolve(request.result as T[]);
    } catch (e) {
      console.error("Error in request.onsuccess", e);
    }
    request.onerror = (event: Event) => {
      const error = (event.target as IDBRequest).error;
      console.error(
        `IndexedDB Request Error in getAllItemsFromStore for store "${storeName}":`,
        error,
        'Details:',
        error?.message,
        error?.stack,
      );
      reject(error);
    };
  });
}

/**
 * Fetches a single record from a Supabase table by its ID.
 * @param supabaseClient The Supabase client instance.
 * @param tableName The name of the Supabase table.
 * @param recordId The ID of the record to fetch.
 * @returns The record data, or null if not found.
 */
export async function getRecordFromSupabase<T>(
  supabaseClient: SupabaseClient,
  tableName: string,
  recordId: string,
): Promise<T | null> {
  try {
    console.log(
      `Fetching single record from Supabase table: ${tableName} with ID: ${recordId}`,
    );
    const { data, error } = await supabaseClient
      .from(tableName)
      .select('*')
      .eq('id', recordId) // Assuming 'id' is the primary key
      .single(); // Expecting a single record

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "No rows found"
      console.error(
        `Error fetching single record from Supabase table ${tableName} with ID ${recordId}:`,
        error,
        'Details:',
        error?.message,
        error?.details,
        error?.hint,
        error?.code,
      );
      throw error;
    }

export const deleteTask = async (id: string): Promise<void> => {
  try {
    await db.tasks.delete(id);
    console.log('Task deleted from IndexedDB:', id);
  } catch (error) {
    logError(
      error,
      `Error deleting task from IndexedDB: ${id}`,
      ERROR_MESSAGE_PREFIX,
    );
  }
};

    console.log(
      `Successfully fetched single record from ${tableName} with ID: ${recordId}`,
    );
    return data as T; // Cast to the expected type
  } catch (error) {
    console.error(
      `Failed to fetch single record from Supabase table ${tableName} with ID ${recordId}:`,
      error,
      'Details:',
      (error as Error)?.message,
      (error as Error)?.stack,
    );
    throw error;
  }
}

// --- Synchronization Logic ---

/**
 * Pulls data from a Supabase table and stores it in IndexedDB.
 * @param supabaseClient The Supabase client instance.
 * @param tableName The name of the Supabase table to pull data from.
 * @param keyField The field in the Supabase table to use as the key in IndexedDB.
 */
export async function syncFromSupabase(
  supabaseClient: SupabaseClient,
  tableName: string,
  keyField: string,
): Promise<void> {
  try {
    console.log(`Starting incremental sync from Supabase table: ${tableName}`);
    const db = await getDb();
    const transaction = db.transaction(
      [MAIN_STORE_NAME, METADATA_STORE_NAME],
      'readwrite',
    );
    console.log(
      `syncFromSupabase: Transaction created for table: ${tableName}`,
    );
    const mainStore = transaction.objectStore(MAIN_STORE_NAME);
    const metadataStore = transaction.objectStore(METADATA_STORE_NAME);

    // 1. Read the last sync timestamp for this table
    const lastSyncKey = `lastSync-${tableName}`;
    const lastSyncTimestamp = await requestToPromise(
      metadataStore.get(lastSyncKey),
    );

    let query = supabaseClient.from(tableName).select('*');

    // If a last sync timestamp exists, fetch only data updated after that timestamp
    if (lastSyncTimestamp) {
      // Assuming 'updated_at' is the timestamp column in your Supabase table
      query = query.gte(
        'updated_at',
        new Date(lastSyncTimestamp).toISOString(),
      );
      console.log(
        `Fetching data from ${tableName} updated after: ${new Date(lastSyncTimestamp).toISOString()}`,
      );
    } else {
      console.log(
        `No previous sync timestamp found for ${tableName}. Fetching all data.`,
=======
export const deleteTask = async (id: string): Promise<void> => {
  try {
    await db.tasks.delete(id);
    console.log('Task deleted from IndexedDB:', id);
  } catch (error) {
    logError(
      error,
      `Error deleting task from IndexedDB: ${id}`,
      ERROR_MESSAGE_PREFIX,
    );
  }
};

export const createProject = async (
  projectData: Omit<Project, 'id' | 'creationTimestamp' | 'updateTimestamp'>,
): Promise<string | undefined> => {
  try {
    const id = crypto.randomUUID();
    const now = Date.now();
    const projectToStore: Project = {
      ...projectData,
      id,
      creationTimestamp: now,
      updateTimestamp: now,
    };
    await db.projects.put(projectToStore);
    console.log('Project added to IndexedDB:', projectToStore);
    return id;
  } catch (error) {
    logError(
      error,
      `Error adding project to IndexedDB: ${projectData.name}`,
      ERROR_MESSAGE_PREFIX,
    );
    return undefined;
  }
};

export const getProject = async (id: string): Promise<Project | undefined> => {
  try {
    const project = await db.projects.get(id);
    console.log('Project retrieved from IndexedDB:', project);
    return project;
  } catch (error) {
    logError(
      error,
      `Error getting project from IndexedDB: ${id}`,
      ERROR_MESSAGE_PREFIX,
    );
    return undefined;
  }
};

export const getAllProjects = async (): Promise<Project[]> => {
  try {
    const projects = await db.projects.toArray();
    console.log('All projects retrieved from IndexedDB:', projects);
    return projects;
  } catch (error) {
    logError(
      error,
      `Error getting all projects from IndexedDB`,
      ERROR_MESSAGE_PREFIX,
    );
    return [];
  }
};

export const updateProject = async (project: Project): Promise<void> => {
  try {
    const projectToStore = { ...project, updateTimestamp: Date.now() };
    await db.projects.put(projectToStore);
    console.log('Project updated in IndexedDB:', projectToStore);
  } catch (error) {
    logError(
      error,
      `Error updating project in IndexedDB: ${project.name}`,
      ERROR_MESSAGE_PREFIX,
    );
  }
};

export const deleteProject = async (id: string): Promise<void> => {
  try {
    // Find all tasks associated with the project being deleted
    const tasksToUpdate = await db.tasks
      .where('projectId')
      .equals(id)
      .toArray();

    // Update these tasks to have no projectId
    const updatedTasks = tasksToUpdate.map((task) => ({
      ...task,
      projectId: 'no-project-selected', // Use the constant for 'no project'
      updateTimestamp: Date.now(),
    }));

    // Perform a bulk update for the tasks
    if (updatedTasks.length > 0) {
      await db.tasks.bulkPut(updatedTasks);
      console.log(
        `Updated ${updatedTasks.length} tasks to 'no-project-selected' after project deletion.`,
>>>>>>> parent of a46766c (refactor(project-management): remove unused props and improve error handling)
      );
    }

    // Fetch data from Supabase
    const { data, error } = await query;

    if (error) {
      console.error(
        `Error fetching data from Supabase table ${tableName}:`,
        error,
        'Details:',
        error?.message,
        error?.details,
        error?.hint,
        error?.code,
      );
      // Do NOT explicitly abort the transaction here.
      // If an error occurs during the Supabase fetch, the transaction
      // might already be in a failed state or will implicitly fail
      // when the promise chain resolves. Explicitly calling abort()
      // on an already finished transaction can lead to the reported error.
      throw error; // Re-throw the error to be caught by the outer catch block
    }

    if (!data || data.length === 0) {
      console.log(`No new data found in Supabase table: ${tableName}`);
      // No new data, but still complete the transaction
      await transactionToPromise(transaction);
      return;
    }

    // Store each new/updated record in IndexedDB using the specified keyField
    for (const record of data) {
      const key = `${tableName}-${record[keyField]}`; // Create a unique key
      mainStore.put(record, key);
    }

    // 2. Update the last sync timestamp in the metadata store
    // Use the timestamp of the *most recent* record fetched, or current time if no records
    const newLastSyncTimestamp = data.reduce((latest, record) => {
      // Assuming 'updated_at' is the timestamp field and is a string parseable by Date
      const recordTimestamp = new Date(record.updated_at).getTime();
      return recordTimestamp > latest ? recordTimestamp : latest;
    }, lastSyncTimestamp || 0); // Start with previous timestamp or 0 if none

    await requestToPromise(
      metadataStore.put(newLastSyncTimestamp, lastSyncKey),
    );

    // Wait for the entire transaction to complete
    await transactionToPromise(transaction);

    console.log(
      `Successfully synced ${data.length} new/updated records from ${tableName} to IndexedDB. New last sync timestamp: ${newLastSyncTimestamp}`,
    );
  } catch (error) {
    console.error(
      `Failed to sync from Supabase table ${tableName}:`,
      error,
      `Error adding category to IndexedDB: ${category.name}`,
      ERROR_MESSAGE_PREFIX,
=======
      `Error adding category to IndexedDB: ${category.name}`,
      ERROR_MESSAGE_PREFIX,
    );
    return undefined;
  }
};

export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const categories = await db.categories.toArray();
    console.log('All categories retrieved from IndexedDB:', categories);
    return categories;
  } catch (error) {
    logError(
      error,
      `Error getting all categories from IndexedDB`,
      ERROR_MESSAGE_PREFIX,
    );
    return [];
  }
};

export const updateCategory = async (category: Category): Promise<void> => {
  try {
    await db.categories.put(category);
    console.log('Category updated in IndexedDB:', category);
  } catch (error) {
    logError(
      error,
      `Error updating category in IndexedDB: ${category.name}`,
      ERROR_MESSAGE_PREFIX,
    );
  }
};

export const deleteCategory = async (id: string): Promise<void> => {
  try {
    await db.categories.delete(id);
    console.log('Category deleted from IndexedDB:', id);
  } catch (error) {
    logError(
      error,
      `Error deleting category from IndexedDB: ${id}`,
      ERROR_MESSAGE_PREFIX,
    );
  }
};

export async function removeCacheItem(key: string): Promise<void> {
  try {
    await db.cache.delete(key);
  } catch (error) {
    console.error(
      `${ERROR_MESSAGE_PREFIX}: Error removing item from cache with key "${key}"`,
      error,
>>>>>>> parent of a46766c (refactor(project-management): remove unused props and improve error handling)
    );
    // The transaction might have already been aborted by the error handler above,
    // but re-throwing ensures the caller knows it failed.
    throw error;
  }
}
