# IndexedDB Service Documentation (`src/lib/indexeddb-service.ts`)

## Overview

The `src/lib/indexeddb-service.ts` file provides a service for interacting with IndexedDB using Dexie.js. It simplifies common IndexedDB operations for storing and retrieving chat messages.

## Functionality

- **Initialize Database:** Initializes the IndexedDB database, ensuring it's open and ready for operations.
- **Add Message:** Adds a new chat message to the database.
- **Get Messages by Session:** Retrieves chat messages for a specific chat session, sorted by timestamp.
- **Get Item:** Retrieves an item from the cache.

## Technical Details

- Uses Dexie.js for a more developer-friendly API over IndexedDB.
- The `ChatDatabase` class extends Dexie to manage the database schema.
- The `chatMessages` table stores chat message records.
- Includes a `cache` table for storing key-value pairs.
- Includes error handling for database operations.

## Usage

```typescript
import { initializeDB, setItem, getChatMessagesBySession, ChatMessageRecord } from '@/lib/indexeddb-service';

// Example usage:
const MyComponent = async () => {
  // Initialize the database
  await initializeDB();

  // Generate a unique session ID
  const chatSessionId = crypto.randomUUID();

  const newMessage: ChatMessageRecord = {
    chatSessionId: chatSessionId,
    sender: 'user',
    text: 'Hello, world!',
  };

  // Add a new message
  await setItem(newMessage);

  // Get messages for a session
  const messages = await getChatMessagesBySession('session123');
  const cachedItem = await getItem('myKey');

  return (
    <div>
      {messages.map((message) => (
        <p key={message.id}>
          {message.sender}: {message.text}
        </p>
      ))}
      {cachedItem && <p>Cached Item: {cachedItem}</p>}
    </div>
  );
};
```

## Functions

- `initializeDB(): Promise<void>`: Initializes the IndexedDB database.
- `setItem(messageData: Omit<ChatMessageRecord, 'id' | 'timestamp'>): Promise<number | undefined>`: Adds a new chat message to the database. Returns the ID of the added message.
- `getChatMessagesBySession(chatSessionId: string): Promise<ChatMessageRecord[]>`: Retrieves chat messages for a specific chat session, sorted by timestamp.
- `getItem<T>(key: string): Promise<T | undefined>`: Retrieves an item from the cache.
