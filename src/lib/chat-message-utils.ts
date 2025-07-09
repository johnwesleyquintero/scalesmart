import { ChatMessageRecord } from '@/lib/indexeddb/chat-db'; // Import from chat-db.ts

export interface MessageMetadata {
  originalUserMessageId?: string;
  // Add other metadata properties as needed
}

export interface Message {
  id: string; // Unique identifier for the message (making it required as it's used for updates)
  sessionId?: string; // Add sessionId to Message interface
  role: 'user' | 'assistant';
  content: string;
  timestamp: number; // Unique identifier for the message
  status?:
    | 'sending'
    | 'sent'
    | 'error'
    | 'responding'
    | 'pending'
    | 'retrying'
    | 'failed'
    | 'receiving'; // Status of the message
  error?: string; // Error message if status is 'error'
  retryCount?: number; // How many times retry has been attempted (starts at 0 for first send)
  retryLimit?: number; // Maximum number of retries allowed for this specific message
  isGreeting?: boolean; // Flag for the initial greeting message
  isEdited?: boolean; // Flag if the message has been edited
  editedAt?: number; // Timestamp of when the message was last edited
  metadata?: MessageMetadata; // Optional metadata property
}

// Maps a ChatMessageRecord from the DB to the Message interface used in the UI
export const mapDbRecordToMessage = (record: ChatMessageRecord): Message => {
  return {
    id: record.id, // ID is already string in ChatMessageRecord
    sessionId: record.sessionId, // Map sessionId
    role: record.sender === 'ai' ? 'assistant' : 'user', // Map 'ai' to 'assistant', 'user' to 'user'
    content: record.text,
    timestamp: record.timestamp,
    // Map other fields from record.metadata if necessary
    status: record.metadata?.status,
    error: record.metadata?.error,
    retryCount: record.metadata?.retryCount,
    retryLimit: record.metadata?.retryLimit,
    isGreeting: record.metadata?.isGreeting,
    isEdited: record.metadata?.isEdited,
    editedAt: record.metadata?.editedAt,
    metadata: record.metadata, // Pass the entire metadata object
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
