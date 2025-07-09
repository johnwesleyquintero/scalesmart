'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';

const floatingButtonClasses =
  'fixed bottom-4 right-4 z-50 rounded-full shadow-lg transition-all duration-300 ease-in-out';

export function FloatingChatButton({
  toggleChatAction,
  isChatOpen,
}: {
  toggleChatAction: () => void;
  isChatOpen: boolean;
}) {
  return (
    <Button
      onClick={toggleChatAction}
      className={cn(
        floatingButtonClasses,
        isChatOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100',
      )}
      title="Open Chat"
      size="lg"
    >
      <MessageSquare className="h-6 w-6" />
    </Button>
  );
}
