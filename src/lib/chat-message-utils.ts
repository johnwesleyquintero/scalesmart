import { ChatMessageRecord } from '@/lib/indexeddb-service';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number; // Unique identifier for the message
  status?: 'sending' | 'sent' | 'error' | 'responding'; // Status of the message
  error?: string; // Error message if status is 'error'
  retryCount?: number; // How many times retry has been attempted (starts at 0 for first send)
  retryLimit?: number; // Maximum number of retries allowed for this specific message
  id?: string; // Unique identifier for the message
  isGreeting?: boolean; // Flag for the initial greeting message
  isEdited?: boolean; // Flag if the message has been edited
  editedAt?: number; // Timestamp of when the message was last edited
}

// Maps a ChatMessageRecord from the DB to the Message interface used in the UI
export const mapDbRecordToMessage = (record: ChatMessageRecord): Message => {
  return {
    id: record.id?.toString(), // Dexie ID is number, UI needs string
    role: record.sender === 'ai' ? 'assistant' : 'user', // Map 'ai' to 'assistant', 'user' to 'user'
    content: record.text,
    timestamp: record.timestamp,
    // Map other fields from record.metadata if necessary
    status: record.metadata?.status as Message['status'],
    error: record.metadata?.error as Message['error'],
    retryCount: record.metadata?.retryCount as Message['retryCount'],
    retryLimit: record.metadata?.retryLimit as Message['retryLimit'],
    isGreeting: record.metadata?.isGreeting as Message['isGreeting'],
    isEdited: record.metadata?.isEdited as Message['isEdited'],
    editedAt: record.metadata?.editedAt as Message['editedAt'],
  };
};

// Maps the Message['role'] to the sender type expected by the database.
export const mapMessageRoleToSender = (
  role: Message['role'],
): 'user' | 'ai' => {
  if (role === 'assistant') {
    return 'ai';
  }
  return 'user'; // If not 'assistant', it must be 'user' based on Message['role']
};
