import Dexie, { Table } from 'dexie';

// Interface for chat messages stored in IndexedDB
export interface ChatMessageRecord {
  id?: number; // Auto-incremented primary key by Dexie
  chatSessionId: string; // To group messages by a specific chat session
  sender: 'user' | 'ai' | 'system'; // Sender of the message
  text: string; // Content of the message
  timestamp: number; // Timestamp of when the message was created/received
  metadata?: Record<string, unknown>; // Optional: for any other data like message status, etc.
}

// Define the Dexie database class
class ChatDatabase extends Dexie {
  // 'chatMessages' is a table in this database.
  // The type parameters are:
  // 1. The interface for the items in the table (ChatMessageRecord)
  // 2. The type of the primary key (number, for auto-incremented id)
  public chatMessages!: Table<ChatMessageRecord, number>;
  public cache!: Table<{ key: string; value: unknown }, string>;

  constructor() {
    super('ChatAppDatabase'); // Name of the IndexedDB database
    this.version(1).stores({
      // Schema definition:
      // '++id': auto-incrementing primary key
      // 'chatSessionId': index for querying by chat session
      // 'timestamp': index for sorting messages by time
      // 'sender': index for filtering by sender
      chatMessages: '++id, chatSessionId, timestamp, sender',
    });
    this.version(2).stores({
      // Add cache table in version 2
      cache: 'key', // Primary key is 'key'
    });
  }
}

// Create a singleton instance of the database
export const db = new ChatDatabase();

/**
 * Initializes the IndexedDB database.
 * Ensures the database is open and ready for operations.
 * Dexie opens the database lazily on the first operation, but calling this
 * explicitly can be useful for early error detection or specific setup logic.
 */
export const initializeDB = async (): Promise<void> => {
  try {
    if (!db.isOpen()) {
      try {
        await db.open();
        console.log('ChatAppDatabase initialized and opened successfully.');
      } catch (openError) {
        console.error('Failed to open ChatAppDatabase:', openError);
        // Re-throw the error so the caller can handle it
        throw openError;
      }
    } else {
      console.log('ChatAppDatabase is already open.');
    }
  } catch (error) {
    console.error('Failed to initialize ChatAppDatabase:', error);
    // Re-throw the error so the caller can handle it
    throw error;
  }
};

/**
 * Adds a new item (chat message) to the IndexedDB.
 * @param messageData - The chat message data to store.
 *                      'id' is auto-generated and 'timestamp' will be set.
 * @returns The ID of the newly added message, or undefined if an error occurs.
 */

/**
 * Retrieves chat messages for a specific chat session, sorted by timestamp.
 * @param chatSessionId - The ID of the chat session.
 * @returns A promise that resolves to an array of chat messages.
 */
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
      `Failed to get messages for session ${chatSessionId}:`,
      error,
    );
    return []; // Return empty array on error or re-throw
  }
};

function logError(error: unknown, message: string, component: string) {
  console.error(`${component}: ${message}`, error);
}

export async function getItem<T>(key: string): Promise<T | undefined> {
  if (!db) {
    await initializeDB();
  }
  try {
    return (await db.cache.get(key).then((item) => item?.value)) as
      | T
      | undefined;
  } catch (error) {
    logError(
      error,
      `Error getting item from IndexedDB: ${key}`,
      'IndexedDBService',
    );
    return undefined;
  }
}

export async function saveCalculation(data: CalculationData): Promise<void> {
  // TODO: Implement saveCalculation
  console.log('saveCalculation called with:', data);
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  if (!db) {
    await initializeDB();
  }
  try {
    await db.cache.put({ key: key, value: value });
  } catch (error) {
    logError(
      error,
      `Error setting item in IndexedDB: ${key}`,
      'IndexedDBService',
    );
  }
}

export async function getCalculations(): Promise<CalculationData[]> {
  // TODO: Implement getCalculations
  console.log('getCalculations called');
  return [];
}

export interface CalculationData {
  id?: number;
  campaignName: string;
  adSpend: number;
  sales: number;
  acos: number;
  roas: number;
  date: Date;
}
// If direct access to the db instance is needed elsewhere (though usually it's better to encapsulate):
// export { db as chatDBInstance };
