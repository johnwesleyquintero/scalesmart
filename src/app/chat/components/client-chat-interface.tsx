'use client';

import dynamic from 'next/dynamic';

const ChatInterface = dynamic(() => import('../ui/chat-interface'), {
  ssr: false,
});

export default function ClientChatInterface() {
  return <ChatInterface />;
}
