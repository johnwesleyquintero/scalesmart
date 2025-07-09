import { setItem, getAllItems, db } from '../indexeddb-service';

// --- Constants for Chat IndexedDB Store Names ---
const CHAT_MESSAGES_STORE_NAME = 'chatMessages';

// --- Types ---
export interface ChatMessageRecord {
  id: string; // Unique ID for the message
  sessionId: string; // ID of the chat session
  sender: 'user' | 'ai' | 'system'; // Added 'system'
  text: string;
  timestamp: number;
  metadata?: {
    status?: 'sending' | 'sent' | 'error';
    error?: string;
    retryCount?: number;
    retryLimit?: number;
    isGreeting?: boolean;
    isEdited?: boolean;
    editedAt?: number;
    originalUserMessageId?: string; // Added originalUserMessageId
  };
  synced?: number; // Added synced property for synchronization status (0 for unsynced, 1 for synced)
}

// --- Chat Message Operations ---

export async function saveChatMessage(
  message: ChatMessageRecord,
): Promise<void> {
  console.log('chat-db: saveChatMessage called with message:', message);
  await setItem(CHAT_MESSAGES_STORE_NAME, message);
  console.log('chat-db: saveChatMessage finished for message:', message.id);
}

export async function getChatMessagesBySession(
  sessionId: string,
): Promise<ChatMessageRecord[]> {
  console.log(
    'chat-db: getChatMessagesBySession called for session:',
    sessionId,
  );
  const allMessages = await getAllItems<ChatMessageRecord>(
    CHAT_MESSAGES_STORE_NAME,
  );
  // Filter messages by session ID
  const sessionMessages = allMessages.filter(
    (msg: ChatMessageRecord) => msg.sessionId === sessionId,
  );
  console.log(
    'chat-db: getChatMessagesBySession found messages:',
    sessionMessages,
  );
  return sessionMessages;
}

export async function getAllChatSessionIds(): Promise<string[]> {
  console.log('chat-db: getAllChatSessionIds called');
  const sessionIds =
    await db[CHAT_MESSAGES_STORE_NAME].orderBy('sessionId').uniqueKeys();
  return sessionIds.map((id) => String(id));
}

export async function clearChatSession(sessionId: string): Promise<void> {
  console.log('chat-db: clearChatSession called for session:', sessionId);
  await db[CHAT_MESSAGES_STORE_NAME].where('sessionId')
    .equals(sessionId)
    .delete();
  console.log('chat-db: clearChatSession finished for session:', sessionId);
}

// Note: Deleting individual chat messages or clearing a session would require
// more complex logic if not using a dedicated object store for each session.
// For now, `deleteItem` from `indexeddb-service` can be used if the key is known.
// A `clearChatSession` function could iterate and delete.
