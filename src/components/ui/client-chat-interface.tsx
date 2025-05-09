'use client';

import dynamic from 'next/dynamic';

const ChatInterface = dynamic(() => import('@/components/ui/chat-interface'), {
  ssr: false,
});

export default function ClientChatInterface() {
  return <ChatInterface />;
}
