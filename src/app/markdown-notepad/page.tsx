'use client';

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MarkdownNotepadProvider,
  useMarkdownNotepadContext,
} from '@/context/MarkdownNotepadContext';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { syncOfflineData } from '@/lib/offline-sync';
import MarkdownEditor from './components/MarkdownEditor';
import CategorySelector from './components/CategorySelector';
import SearchBar from './components/SearchBar';
import MarkdownTabs from './components/MarkdownTabs'; // Import MarkdownTabs
import NoteContent from './components/NoteContent'; // Import NoteContent
import {
  getNotesByCategory,
  searchNotes,
  getNote,
} from '@/lib/indexeddb/markdown-notepad-db';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarkdownCategoryManagementTab } from './components/MarkdownCategoryManagementTab';
import NoteListAndActions from './components/NoteListAndActions';
import { Note } from '@/types/indexeddb';
import { useToast } from '@/hooks/use-toast';
import NotepadHeader from './components/NotepadHeader';
import NotesTabContent from './components/NotesTabContent';
import ImportExportButtons from './components/ImportExportButtons';

const MarkdownNotepad = () => {
  return (
    <MarkdownNotepadProvider>
      <NotepadContent />
    </MarkdownNotepadProvider>
  );
};

const NotepadContent = () => {
  const { createNewNote } = useMarkdownNotepadContext();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const isOnline = useOnlineStatus();
  const { toast } = useToast();

  useEffect(() => {
    if (isOnline) {
      console.log('Application is online. Checking for notes to sync...');
      syncOfflineData().then(() => {
        toast({
          title: 'Sync Complete',
          description: 'Your offline notes have been successfully synced.',
        });
      });
    }
  }, [isOnline, toast]);

  return (
    <div className="container mx-auto p-4">
      <NotepadHeader />

      <div className="bg-card p-6 rounded-lg shadow-md">
        <Tabs defaultValue="notes" className="w-full">
          <div className="flex flex-wrap items-center mb-4">
            <TabsList className="h-auto justify-start bg-muted mr-2">
              {' '}
              {/* Added mr-2 for spacing */}
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="category-management">
                Category Management
              </TabsTrigger>
            </TabsList>
            <Button
              onClick={async () => {
                setIsLoading(true);
                try {
                  const newNoteId = await createNewNote();
                  // Logic to open the new note in a tab will be handled within NotesTabContent
                } finally {
                  setIsLoading(false);
                }
              }}
              className=""
              disabled={isLoading} // Disable when loading
            >
              Create New Note
            </Button>
          </div>{' '}
          {/* Wrapped TabsList and Button in a flex div */}
          <div className="mb-4">
            <ImportExportButtons />
          </div>
          <TabsContent value="notes" className="space-y-4 mt-4">
            <NotesTabContent
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </TabsContent>
          <TabsContent value="category-management" className="space-y-4 mt-4">
            <MarkdownCategoryManagementTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MarkdownNotepad;
