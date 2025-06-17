'use client';

import dynamic from 'next/dynamic';

const ChatInterface = dynamic(() => import('../ui/chat-interface'), {
  ssr: false,
});

/**
 * A client-side wrapper for the ChatInterface component,
 * ensuring it is only rendered in the browser environment.
 */
export default function ClientChatInterface() {
  return <ChatInterface />;
}
