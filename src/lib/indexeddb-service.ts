import Dexie, { Table } from 'dexie';
import { INDEXED_DB_ACOS_CALCULATOR_HISTORY_KEY } from './constants';
import { Contact } from '@/app/crm/types';

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
  public events!: Table<Event, number>;
  public contacts!: Table<Contact, string>;

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
    this.version(3).stores({
      events: '++id, date', // Primary key is 'id', index on 'date'
    });
    this.version(4).stores({
      contacts:
        'id, name, email, phone, company, notes, creationTimestamp, updateTimestamp',
    });
  }
}

// Create a singleton instance of the database
export const db = new ChatDatabase();

export interface Event {
  id?: number;
  date: string;
  title: string;
  description?: string;
}

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
  if (!db) {
    await initializeDB();
  }

  try {
    await db.transaction('rw', db.cache, async () => {
      await db.cache.put({
        key: `${INDEXED_DB_ACOS_CALCULATOR_HISTORY_KEY}-${data.campaignName}-${data.date}`,
        value: data,
      });
      console.log('Calculation saved to IndexedDB:', data);
    });
  } catch (error) {
    logError(
      error,
      `Error saving calculation to IndexedDB: ${data.campaignName}`,
      'IndexedDBService',
    );
  }
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

export const addEvent = async (event: Event): Promise<number | undefined> => {
  if (!db) {
    await initializeDB();
  }
  try {
    const id = await db.events.add(event);
    console.log('Event added to IndexedDB:', event);
    return id;
  } catch (error) {
    logError(
      error,
      `Error adding event to IndexedDB: ${event.title}`,
      'IndexedDBService',
    );
    return undefined;
  }
};

export async function getCalculations(): Promise<CalculationData[]> {
  if (!db) {
    await initializeDB();
  }

  try {
    const calculations: CalculationData[] = [];
    await db.cache.each((item) => {
      if (item.key.startsWith(INDEXED_DB_ACOS_CALCULATOR_HISTORY_KEY)) {
        calculations.push(item.value as CalculationData);
      }
    });
    console.log('getCalculations returning:', calculations);
    return calculations;
  } catch (error) {
    logError(
      error,
      `Error getting calculations from IndexedDB`,
      'IndexedDBService',
    );
    return [];
  }
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

// CRM Contact methods

export const createContact = async (
  contact: Contact,
): Promise<string | undefined> => {
  if (!db) {
    await initializeDB();
  }
  try {
    const id = crypto.randomUUID();
    const creationTimestamp = Date.now();
    const updateTimestamp = Date.now();
    const contactToStore = {
      ...contact,
      id,
      creationTimestamp,
      updateTimestamp,
    };
    await db.contacts.put(contactToStore);
    console.log('Contact added to IndexedDB:', contact);
    return id;
  } catch (error) {
    logError(
      error,
      `Error adding contact to IndexedDB: ${contact.name}`,
      'IndexedDBService',
    );
    return undefined;
  }
};

export const getContact = async (id: string): Promise<Contact | undefined> => {
  if (!db) {
    await initializeDB();
  }
  try {
    const contact = await db.contacts.get(id);
    console.log('Contact retrieved from IndexedDB:', contact);
    return contact;
  } catch (error) {
    logError(
      error,
      `Error getting contact from IndexedDB: ${id}`,
      'IndexedDBService',
    );
    return undefined;
  }
};

export const updateContact = async (contact: Contact): Promise<void> => {
  if (!db) {
    await initializeDB();
  }
  try {
    const updateTimestamp = Date.now();
    const contactToStore = { ...contact, updateTimestamp };
    await db.contacts.put(contactToStore);
    console.log('Contact updated in IndexedDB:', contact);
  } catch (error) {
    logError(
      error,
      `Error updating contact in IndexedDB: ${contact.name}`,
      'IndexedDBService',
    );
  }
};

export const deleteContact = async (id: string): Promise<void> => {
  if (!db) {
    await initializeDB();
  }
  try {
    await db.contacts.delete(id);
    console.log('Contact deleted from IndexedDB:', id);
  } catch (error) {
    logError(
      error,
      `Error deleting contact from IndexedDB: ${id}`,
      'IndexedDBService',
    );
  }
};

export const getAllContacts = async (): Promise<Contact[]> => {
  if (!db) {
    await initializeDB();
  }
  try {
    const contacts = await db.contacts.toArray();
    console.log('All contacts retrieved from IndexedDB:', contacts);
    return contacts;
  } catch (error) {
    logError(
      error,
      `Error getting all contacts from IndexedDB`,
      'IndexedDBService',
    );
    return [];
  }
};
// If direct access to the db instance is needed elsewhere (though usually it's better to encapsulate):
// export { db as chatDBInstance };
