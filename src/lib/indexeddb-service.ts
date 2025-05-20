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
  }
}

// Create a singleton instance of the database
const db = new ChatDatabase();

/**
 * Initializes the IndexedDB database.
 * Ensures the database is open and ready for operations.
 * Dexie opens the database lazily on the first operation, but calling this
 * explicitly can be useful for early error detection or specific setup logic.
 */
export const initializeDB = async (): Promise<void> => {
  try {
    if (!db.isOpen()) {
      await db.open();
      console.log('ChatAppDatabase initialized and opened successfully.');
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
export const setItem = async (
  messageData: Omit<ChatMessageRecord, 'id' | 'timestamp'>
): Promise<number | undefined> => {
  try {
    // Ensure all required fields are present before casting
    const fullMessageData: ChatMessageRecord = {
      ...messageData,
      timestamp: Date.now(),
    } as ChatMessageRecord; // Cast to satisfy Dexie's add method if needed
    const id = await db.chatMessages.add(fullMessageData);
    console.log(`Message with id ${id} added to chatMessages table.`);
    return id;
  } catch (error) {
    console.error('Failed to set item in chatMessages table:', error);
    return undefined; // Or re-throw error as appropriate for your error handling strategy
  }
};

/**
 * Retrieves chat messages for a specific chat session, sorted by timestamp.
 * @param chatSessionId - The ID of the chat session.
 * @returns A promise that resolves to an array of chat messages.
 */
export const getChatMessagesBySession = async (chatSessionId: string): Promise<ChatMessageRecord[]> => {
  try {
    return await db.chatMessages
      .where('chatSessionId')
      .equals(chatSessionId)
      .sortBy('timestamp');
  } catch (error) {
    console.error(`Failed to get messages for session ${chatSessionId}:`, error);
    return []; // Return empty array on error or re-throw
  }
};

// If direct access to the db instance is needed elsewhere (though usually it's better to encapsulate):
// export { db as chatDBInstance };