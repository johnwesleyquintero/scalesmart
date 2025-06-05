'use client';

import ChatInterface from '@/components/ui/chat-interface'; // Import the ChatInterface component

export default function ChatPage() {
  return (
    <div
      className="container mx-auto py-8 px-4 min-h-[calc(100vh-64px)]"
      role="region"
      aria-label="WesAI Agent Chat Interface"
    >
      <div className="max-w-4xl mx-auto bg-card rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-border">
          <h1
            className="text-3xl font-bold text-center mb-2 text-foreground"
            id="chatHeading"
          >
            WesAI Agent
          </h1>
          <p
            className="text-center text-muted-foreground"
            aria-describedby="chatHeading"
          >
            Your assistant for crafting job application responses.
          </p>
        </div>
        <div className="p-6">
          <ChatInterface /> {/* Use the imported ChatInterface component */}
        </div>
      </div>
    </div>
  );
}
