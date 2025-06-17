# Chat Interface

A component that provides a full-featured chat interface, including message display, input, and actions. It integrates with an AI backend and uses IndexedDB for message persistence.

## Usage

The `ChatInterface` component is a self-contained chat UI. It manages its own state, handles user input, interacts with an API for AI responses, and saves messages locally using IndexedDB.

```jsx
import ChatInterface from '@/components/ui/chat-interface';

function MyApp() {
  return (
    <div>
      {/* Other application content */}
      <ChatInterface />
    </div>
  );
}
```

## Features

- **Message Display:** Shows a list of messages, distinguishing between user and AI messages.
- **Message Input:** Provides a textarea for users to type messages.
- **Send Messages:** Sends user messages to an AI backend and displays the AI's response.
- **Message Persistence:** Saves and loads chat messages from IndexedDB.
- **Retry Mechanism:** Allows retrying failed AI responses.
- **Message Editing:** Enables editing of user messages.
- **Message Deletion:** Allows deleting individual messages.
- **Copy Chat:** Copies the entire chat conversation as Markdown.
- **Fullscreen Mode:** Toggles a fullscreen view of the chat interface.
- **Agent Mode Toggle:** Switches between different AI agent modes (currently 'default' and 'code').
- **Prompts to Try:** Displays suggested prompts when the chat is empty.
- **Auto-scrolling:** Automatically scrolls to the latest message.
- **Textarea Auto-resize:** The input textarea automatically adjusts its height based on content.

## Composed Components

This component composes the following UI components:

- [`MessageBubble`](src/components/ui/MessageBubble.tsx)
- [`MessageContent`](src/components/ui/MessageContent.tsx)
- [`Button`](docs/components/button.md)
- [`CopyMarkdownButton`](src/components/ui/CopyMarkdownButton.tsx)
- `FloatingChatButton` (exported separately)

## State Management

The component uses `useReducer` for managing its internal state, including the list of messages, input value, loading state, chat visibility, fullscreen mode, editing message state, and the current agent mode.

## Data Persistence

Messages are saved to and loaded from IndexedDB using the `indexeddb-service.ts` utility. Each chat session is identified by a unique ID.

## API Interaction

The component interacts with an AI API (via `fetchAndProcessChatApi`) to send user messages and receive streaming AI responses.

## Notes

- The `FloatingChatButton` is exported separately and is typically used to toggle the visibility of the `ChatInterface`.
- The component relies on several utility functions and hooks from the `@/lib` and `@/hooks` directories.
