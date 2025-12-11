import Dexie, { Table, IndexableType } from 'dexie';
 

// --- Type Definitions ---
// Consolidate imports for better organization
import { ModuleProgressRecord, QuizResultRecord, Event, Prediction, Dashboard } from '@/types/indexeddb';

export type { ModuleProgressRecord, QuizResultRecord, Event, Prediction, Dashboard };

// --- Constants ---

const DB_NAME = 'ScaleSmartDatabase';
const SERVICE_NAME = 'IndexedDBService';

// Store Names (matching class properties where possible, or schema names)
// Using constants helps avoid magic strings and potential typos.
const STORE_MODULE_PROGRESS = 'moduleProgress';
const STORE_QUIZ_RESULTS = 'quizResults';
const STORE_CACHE = 'cache';
const STORE_EVENTS = 'events';
const STORE_PREDICTIONS = 'predictions';
const STORE_DASHBOARDS = 'dashboards';

// --- Database Class Definition ---

class ScaleSmartDatabase extends Dexie {
  // Define table properties using store name constants or descriptive names
  public readonly [STORE_MODULE_PROGRESS]!: Table<
    ModuleProgressRecord,
    [string, string, string]
  >;
  public readonly [STORE_QUIZ_RESULTS]!: Table<
    QuizResultRecord,
    [string, string]
  >;
  public readonly [STORE_CACHE]!: Table<
    { key: string; value: unknown },
    string
  >;
  public readonly [STORE_EVENTS]!: Table<Event, number>;
  public readonly [STORE_PREDICTIONS]!: Table<Prediction, string>;
  public readonly [STORE_DASHBOARDS]!: Table<Dashboard, string>;

  constructor() {
    super(DB_NAME);

    // Define schema strings inline or as constants for clarity,
    // but avoid overly complex strings if the structure is simple (like id, name).
    // Ensure store names here match the constants and property names.
    this.version(18).stores({
      [STORE_CACHE]: 'key',
      [STORE_EVENTS]: '++id, date',
      [STORE_PREDICTIONS]: 'id, timestamp, *synced',
      [STORE_DASHBOARDS]: 'id, name',
    });

    // Chain version upgrades sequentially.
    // The original code had duplicate version(19) blocks, which is incorrect.
    // Combine the schema definitions and upgrade logic for version 19 into one block.
    this.version(20)
      .stores({
        [STORE_MODULE_PROGRESS]: '[userId+moduleId+progressKey]',
        [STORE_QUIZ_RESULTS]: '[userId+moduleId]',
        [STORE_CACHE]: 'key',
        [STORE_EVENTS]: '++id, date',
        [STORE_PREDICTIONS]: 'id, timestamp, *synced',
        [STORE_DASHBOARDS]: 'id, name, synced',
      })
      .upgrade(async (trans) => {
        console.log(`Upgrading ${DB_NAME} from previous version to 20`);

        // Add 'synced' property to existing records if they don't have it
        const tablesToUpdate = [
          STORE_PREDICTIONS,
          STORE_DASHBOARDS,
        ];

        for (const storeName of tablesToUpdate) {
          await trans
            .table(storeName)
            .toCollection()
            .modify((item) => {
              if (item && typeof item === 'object' && !('synced' in item)) {
                item.synced = 1; // Assume existing data is synced, changed from true to 1
              }
            });
        }
      });

    this.on('versionchange', (event) => {
      console.warn(
        `${SERVICE_NAME}: Database version change detected. Old version: ${event.oldVersion}, New version: ${event.newVersion}`,
      );
      // Optional: Handle specific version change scenarios, like prompting user to refresh
    });
  }
}

export const db = new ScaleSmartDatabase();

// --- Prediction Specific Functions ---

export const savePrediction = async (
  predictionData: Omit<Prediction, 'id' | 'timestamp' | 'synced'>,
): Promise<string> => {
  try {
    const id = crypto.randomUUID();
    const timestamp = Date.now();
    const predictionToStore: Prediction = {
      ...predictionData,
      id,
      timestamp,
      synced: 0, // Changed from false to 0
    };
    await setItem<Prediction>(STORE_PREDICTIONS, predictionToStore);
    console.log(`${SERVICE_NAME}: Prediction saved`, predictionToStore);
    return id;
  } catch (error) {
    logError(error, `Error saving prediction`, SERVICE_NAME);
    throw error;
  }
};

export const getPrediction = async (
  id: string,
): Promise<Prediction | undefined> => {
  try {
    return await getItem<Prediction>(STORE_PREDICTIONS, id);
  } catch (error) {
    logError(error, `Error getting prediction with id: ${id}`, SERVICE_NAME);
    throw error;
  }
};

// --- Dashboard Specific Functions ---

export const saveDashboardConfig = async (
  dashboardData: Omit<Dashboard, 'synced'>,
): Promise<string> => {
  try {
    const dashboardToStore: Dashboard = {
      ...dashboardData,
      synced: 0, // Changed from false to 0
    };
    await setItem<Dashboard>(STORE_DASHBOARDS, dashboardToStore);
    console.log(`${SERVICE_NAME}: Dashboard config saved`, dashboardToStore);
    return dashboardToStore.id;
  } catch (error) {
    logError(error, `Error saving dashboard config`, SERVICE_NAME);
    throw error;
  }
};

export const getDashboardConfig = async (
  id: string,
): Promise<Dashboard | undefined> => {
  try {
    return await getItem<Dashboard>(STORE_DASHBOARDS, id);
  } catch (error) {
    logError(
      error,
      `Error getting dashboard config with id: ${id}`,
      SERVICE_NAME,
    );
    throw error;
  }
};

export const getAllDashboards = async (): Promise<Dashboard[]> => {
  try {
    return await getAllItems<Dashboard>(STORE_DASHBOARDS);
  } catch (error) {
    logError(error, `Error getting all dashboards`, SERVICE_NAME);
    throw error;
  }
};

// --- Helper Functions ---

function logError(
  error: unknown,
  message: string,
  component: string = SERVICE_NAME,
): void {
  console.error(`${component}: ${message}`, error);
  // Consider integrating with a logging service (e.g., Sentry, LogRocket)
}

// Function to initialize the database connection
export const initializeDB = async (): Promise<void> => {
  if (db.isOpen()) {
    console.log(`${SERVICE_NAME}: ${DB_NAME} is already open.`);
    return;
  }

  try {
    await db.open();
    console.log(
      `${SERVICE_NAME}: ${DB_NAME} initialized and opened successfully.`,
    );
  } catch (error) {
    logError(error, `Failed to open ${DB_NAME}`);
    throw error; // Re-throw to signal failure
  }
};

// --- Generic CRUD Operations ---
// These functions assume the primary key is part of the `value` object
// (e.g., an `id` field for string keys, or `++id` for number keys).
// They also assume getItem/deleteItem are called with the primary key value.

/**
 * Adds or updates an item in a specified store.
 * Assumes the item object contains the primary key property as defined in the schema.
 * @param storeName The name of the store.
 * @param value The item object to add or update.
 * @returns A promise resolving to the primary key of the added/updated item.
 */
export async function setItem<T>(
  storeName: string,
  value: T,
): Promise<IndexableType> {
  try {
    const table = db.table(storeName);
    const key = await table.put(value);
    // console.log(`${SERVICE_NAME}: Item set in "${storeName}"`, value);
    return key;
  } catch (error) {
    logError(error, `Error setting item in store "${storeName}"`, SERVICE_NAME);
    throw error; // Re-throw to allow specific services to handle
  }
}

/**
 * Retrieves an item from a specified store by its primary key.
 * @param storeName The name of the store.
 * @param key The primary key of the item.
 * @returns A promise resolving to the item, or undefined if not found.
 */
export async function getItem<T>(
  storeName: string,
  key: IndexableType,
): Promise<T | undefined> {
  try {
    const table = db.table(storeName);
    const item = await table.get(key);
    // Log success might be noisy.
    // console.log(`${SERVICE_NAME}: Item retrieved from "${storeName}" with key "${key}"`, item);
    return item;
  } catch (error) {
    logError(
      error,
      `Error getting item from store "${storeName}" with key "${key}"`,
      SERVICE_NAME,
    );
    throw error; // Re-throw
  }
}

/**
 * Deletes an item from a specified store by its primary key.
 * @param storeName The name of the store.
 * @param key The primary key of the item.
 * @returns A promise that resolves when the item is deleted.
 */
export async function deleteItem(
  storeName: string,
  key: IndexableType,
): Promise<void> {
  try {
    const table = db.table(storeName);
    await table.delete(key);
    console.log(
      `${SERVICE_NAME}: Item deleted from "${storeName}" with key "${key}"`,
    );
  } catch (error) {
    logError(
      error,
      `Error deleting item from store "${storeName}" with key "${key}"`,
      SERVICE_NAME,
    );
    throw error; // Re-throw
  }
}

/**
 * Clears all items from a specified store.
 * @param storeName The name of the store.
 * @returns A promise that resolves when the store is cleared.
 */
export async function clearStore(storeName: string): Promise<void> {
  try {
    const table = db.table(storeName);
    await table.clear();
    console.log(`${SERVICE_NAME}: Store "${storeName}" cleared`);
  } catch (error) {
    logError(error, `Error clearing store "${storeName}"`, SERVICE_NAME);
    throw error; // Re-throw
  }
}

/**
 * Retrieves all items from a specified store.
 * @param storeName The name of the store.
 * @returns A promise resolving to an array of all items.
 */
export async function getAllItems<T>(storeName: string): Promise<T[]> {
  try {
    const table = db.table(storeName);
    const items = await table.toArray();
    // Log success might be noisy.
    // console.log(`${SERVICE_NAME}: All items retrieved from "${storeName}" (${items.length})`);
    return items;
  } catch (error) {
    logError(
      error,
      `Error getting all items from store "${storeName}"`,
      SERVICE_NAME,
    );
    throw error; // Re-throw
  }
}

/**
 * Adds or updates multiple items in a specified store in a single transaction.
 * This is more efficient than calling setItem multiple times.
 * @param storeName The name of the store.
 * @param items An array of items to add or update.
 * @returns A promise that resolves when the operation is complete.
 */
export async function bulkSetItems<T>(
  storeName: string,
  items: T[],
): Promise<void> {
  try {
    const table = db.table(storeName);
    await table.bulkPut(items);
  } catch (error) {
    logError(
      error,
      `Error bulk setting items in store "${storeName}"`,
      SERVICE_NAME,
    );
    throw error;
  }
}

/**
 * Retrieves all items from a specified store.
 * @param storeName The name of the store.
 * @returns A promise resolving to an array of all items.
 * @deprecated Use `getAllItems` instead for clarity.
 */
export const getAllItemsFromStore = getAllItems;

/**
 * Retrieves all unsynced items from a specified store.
 * Assumes items have a 'synced' boolean property.
 * @param storeName The name of the store.
 * @returns A promise resolving to an array of unsynced items.
 */
export async function getUnsyncedItems<T extends { synced?: number }>(
  storeName: string,
): Promise<T[]> {
  try {
    const table = db.table(storeName);
    const unsynced = await table.where('synced').equals(0).toArray(); // Changed from false to 0
    return unsynced;
  } catch (error) {
    logError(
      error,
      `Error getting unsynced items from store "${storeName}"`,
      SERVICE_NAME,
    );
    throw error;
  }
}

/**
 * Marks an item as synced in a specified store.
 * Assumes the item object contains the primary key property and a 'synced' number property (0 for unsynced, 1 for synced).
 * @param storeName The name of the store.
 * @param item The item object to mark as synced.
 * @returns A promise that resolves when the item is updated.
 */
export async function markItemAsSynced<
  T extends { id: IndexableType; synced?: number },
>(storeName: string, item: T): Promise<void> {
  try {
    const table = db.table(storeName);
    // Ensure the item has an 'id' property for the put operation
    if ('id' in item && item.id !== undefined) {
      const updatedItem = { ...item, synced: 1 }; // Changed from true to 1
      await table.put(updatedItem);
      console.log(
        `${SERVICE_NAME}: Item with id "${item.id}" in "${storeName}" marked as synced.`,
      );
    } else {
      console.warn(
        `${SERVICE_NAME}: Cannot mark item as synced, 'id' property is missing or undefined for item in store "${storeName}".`,
        item,
      );
    }
  } catch (error) {
    // Safely get the ID for logging, handling cases where 'item' might not have a valid 'id'
    const itemIdForLog =
      item && typeof item === 'object' && 'id' in item
        ? String(item.id) // Convert to string for logging
        : 'unknown';

    logError(
      error,
      `Error marking item with id "${itemIdForLog}" in store "${storeName}" as synced`,
      SERVICE_NAME,
    );
    throw error;
  }
}

// --- Specific Service Functions ---
// These functions leverage the generic CRUD or use direct Dexie methods for complex queries.

// Removed chat session helpers

//

export async function getCacheItem<T>(key: string): Promise<T | undefined> {
  const item = await getItem<{ key: string; value: T }>(STORE_CACHE, key);
  return item?.value;
}

export async function setCacheItem<T>(key: string, value: T): Promise<string> {
  // The cache store uses 'key' as its primary key
  const itemToStore = { key: key, value: value };
  // Explicitly cast the return type of setItem to string, as we know the primary key for STORE_CACHE is a string
  const resultKey: string = (await setItem<{ key: string; value: T }>(
    STORE_CACHE,
    itemToStore,
  )) as string;
  return resultKey;
}

export async function removeCacheItem(key: string): Promise<void> {
  await deleteItem(STORE_CACHE, key);
}

export const addEvent = async (event: Omit<Event, 'id'>): Promise<number> => {
  try {
    // Assuming 'id' is auto-incrementing (++id) for events
    const id = await db[STORE_EVENTS].add(event as Event); // Dexie generates ++id
    console.log(`${SERVICE_NAME}: Event added`, event);
    return id;
  } catch (error) {
    logError(
      error,
      `Error adding event: ${'title' in event ? event.title : 'Untitled Event'}`,
      SERVICE_NAME,
    );
    throw error;
  }
};

// Example using direct Dexie query for calculations
 

// Example using direct Dexie query for calculations by campaign
 

// Example using setItem for adding, assuming UUID is generated before calling setItem
// Removed CRM contact helpers

//

//

//

//

// Removed Project Management helpers

//

//

//

//

//

//

//

//

//

//

//

// Removed CRM-specific helpers

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

//

// Task Comments Specific Functions

//

// Calendar Events Specific Functions

export async function getEventsByDate(date: string): Promise<Event[]> {
  try {
    const events = await db[STORE_EVENTS].where('date').equals(date).toArray();
    return events;
  } catch (error) {
    logError(error, `Error getting events for date ${date}`, SERVICE_NAME);
    throw error;
  }
}

// Learning Module Specific Functions

export async function getQuizResultsByUserIdAndModuleId(
  userId: string,
  moduleId: string,
): Promise<QuizResultRecord[]> {
  try {
    const results = await db[STORE_QUIZ_RESULTS].where('[userId+moduleId]')
      .equals([userId, moduleId])
      .toArray();
    return results;
  } catch (error) {
    logError(
      error,
      `Error getting quiz results for user ${userId} and module ${moduleId}`,
      SERVICE_NAME,
    );
    throw error;
  }
}

//

//

//

//

//

export async function getModuleProgressByUserId(
  userId: string,
): Promise<ModuleProgressRecord[]> {
  try {
    // Assuming moduleProgress has 'userId' index or is part of composite key
    const progress = await db[STORE_MODULE_PROGRESS].where('userId')
      .equals(userId)
      .toArray();
    return progress;
  } catch (error) {
    logError(
      error,
      `Error getting module progress for user ${userId}`,
      SERVICE_NAME,
    );
    throw error;
  }
}
