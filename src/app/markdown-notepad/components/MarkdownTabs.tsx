'use client';

import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useMarkdownNotepadContext } from '@/context/MarkdownNotepadContext';

interface MarkdownTabsProps {
  openNoteIds: string[];
  activeNoteId: string | null;
  onTabChange: (noteId: string) => void;
  onTabClose: (noteId: string) => void;
  noteTitles: { [key: string]: string };
}

const MarkdownTabs: React.FC<MarkdownTabsProps> = ({
  openNoteIds,
  activeNoteId,
  onTabChange,
  onTabClose,
  noteTitles,
}) => {
  return (
    <Tabs
      value={activeNoteId || ''}
      onValueChange={onTabChange}
      className="w-full"
    >
      <TabsList className="flex flex-wrap h-auto justify-start bg-muted p-1 rounded-md">
        {openNoteIds.map((noteId) => (
          <TabsTrigger
            key={noteId}
            value={noteId}
            className="flex items-center px-3 py-1.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-sm mr-1 mb-1"
          >
            <span className="truncate max-w-[150px]">
              {noteTitles[noteId] || 'Untitled'}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="ml-2 h-5 w-5 p-0.5 rounded-full hover:bg-accent"
              onClick={(e) => {
                e.stopPropagation(); // Prevent tab change when closing
                onTabClose(noteId);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default MarkdownTabs;
