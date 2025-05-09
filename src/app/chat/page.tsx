'use client';

import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

export default function ChatPage() {
  const ChatWithLoading = dynamic<unknown>(
    () => import('@/components/ui/chat-interface').then((mod) => mod.default),
    {
      loading: () => (
        <div className="flex flex-col items-center justify-center h-64">
          <Skeleton className="w-3/4 h-8 mb-4" />
          <Skeleton className="w-1/2 h-6" />
        </div>
      ),
      ssr: false,
    },
  );

  return (
    <div
      className="container mx-auto py-8 px-4 min-h-[calc(100vh-64px)]"
      role="region"
      aria-label="Chat interface"
    >
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-center mb-2" id="chatHeading">
            AI Chat Assistant
          </h1>
          <p
            className="text-center text-gray-500 dark:text-gray-400"
            aria-describedby="chatHeading"
          >
            Ask me anything about my portfolio or projects
          </p>
        </div>
        <div className="p-6">
          <ChatWithLoading />
        </div>
      </div>
    </div>
  );
}
