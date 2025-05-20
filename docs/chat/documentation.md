# Chat Page Documentation (`src/app/chat/page.tsx`)

## Overview

The `src/app/chat/page.tsx` file defines the chat page, which displays an AI chat assistant. It uses dynamic import to load the `chat-interface` component and displays a skeleton loader while the component is loading.

## Functionality

- **Displays AI Chat Assistant:** Displays an AI chat assistant that allows users to ask questions about the portfolio or projects.
- **Uses Dynamic Import:** Uses dynamic import to load the `chat-interface` component, improving initial load time.
- **Displays Skeleton Loader:** Displays a skeleton loader while the `chat-interface` component is loading.
- **The chat interface component now displays the retry limit in the message bubble.**

## Technical Details

- The page uses the `dynamic` function from `next/dynamic` to load the `chat-interface` component.
- The page uses the `Skeleton` component from the `@/components/ui` library to display a skeleton loader.

## Data Flow

1.  The `ChatPage` component is rendered.
2.  The component uses dynamic import to load the `chat-interface` component.
3.  While the `chat-interface` component is loading, the component displays a skeleton loader.
4.  Once the `chat-interface` component has loaded, it is rendered on the page.
