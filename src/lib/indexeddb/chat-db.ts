import { setItem, getItem, getAllItemsFromStore } from '../indexeddb-service';

// --- Constants for Chat IndexedDB Store Names ---
const CHAT_MESSAGES_STORE_NAME = 'chat-messages';

// --- Types ---
export interface ChatMessageRecord {
  id: string; // Unique ID for the message
  sessionId: string; // ID of the chat session
  sender: 'user' | 'ai';
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
  };
}

// --- Chat Message Operations ---

export async function saveChatMessage(
  message: ChatMessageRecord,
): Promise<void> {
  console.log('chat-db: saveChatMessage called with message:', message);
  // The key for a chat message will be a combination of sessionId and messageId
  const key = `${message.sessionId}-${message.id}`;
  await setItem(CHAT_MESSAGES_STORE_NAME, key, message);
  console.log('chat-db: saveChatMessage finished for key:', key);
}

export async function getChatMessagesBySession(
  sessionId: string,
): Promise<ChatMessageRecord[]> {
  console.log(
    'chat-db: getChatMessagesBySession called for session:',
    sessionId,
  );
  const allMessages = await getAllItemsFromStore<ChatMessageRecord>(
    CHAT_MESSAGES_STORE_NAME,
  );
  // Filter messages by session ID
  const sessionMessages = allMessages.filter(
    (msg) => msg.sessionId === sessionId,
  );
  console.log(
    'chat-db: getChatMessagesBySession found messages:',
    sessionMessages,
  );
  return sessionMessages;
}

// Note: Deleting individual chat messages or clearing a session would require
// more complex logic if not using a dedicated object store for each session.
// For now, `deleteItem` from `indexeddb-service` can be used if the key is known.
// A `clearChatSession` function could iterate and delete.
