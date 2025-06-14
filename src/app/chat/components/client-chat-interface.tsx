'use client';

import dynamic from 'next/dynamic';

const ChatInterface = dynamic(() => import('./chat-interface'), {
  ssr: false,
});

export default function ClientChatInterface() {
  return <ChatInterface />;
}
