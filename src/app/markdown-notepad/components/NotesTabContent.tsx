'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useMarkdownNotepadContext } from '@/context/MarkdownNotepadContext';
import MarkdownEditor from './MarkdownEditor';
import CategorySelector from './CategorySelector';
import SearchBar from './SearchBar';
import MarkdownTabs from './MarkdownTabs';
import NoteContent from './NoteContent';
import NoteListAndActions from './NoteListAndActions'; // Import NoteListAndActions
import { getNote } from '@/lib/indexeddb/markdown-notepad-db';
import { Button } from '@/components/ui/button';
import { Note } from '@/types/indexeddb';
import { useToast } from '@/hooks/use-toast';
import NoteActions from './NoteActions';
import { useNotesData } from '@/hooks/use-notes-data'; // Import the new hook

interface NotesTabContentProps {
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const NotesTabContent: React.FC<NotesTabContentProps> = ({
  isLoading,
  setIsLoading,
}) => {
  const {
    category,
    searchQuery,
    createNewNote,
    allCategories,
    fetchCategories,
    handleDeleteNote,
    handleUpdateNote,
  } = useMarkdownNotepadContext();
  const { notes, selectedNoteId, setSelectedNoteId } = useNotesData({
    setIsLoading,
  }); // Use the new hook
  const [activeNoteContent, setActiveNoteContent] = useState<string>('');
  const [activeNoteTitle, setActiveNoteTitle] = useState<string>('');
  const { toast } = useToast();
  // const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null); // Removed, now from hook
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [bulkCategory, setBulkCategory] = useState<string>('');
  const [openNoteIds, setOpenNoteIds] = useState<string[]>([]);
  const [noteTitles, setNoteTitles] = useState<{ [key: string]: string }>({});

  // Effect to trigger note fetching and reset selection when category or search query changes
  // This effect is now handled within useNotesData hook
  // Effect to load content of the active note
  useEffect(() => {
    const loadActiveNoteContent = async () => {
      if (selectedNoteId) {
        try {
          const note = await getNote(selectedNoteId);
          if (note) {
            setActiveNoteContent(note.markdown || '');
            setActiveNoteTitle(note.title || 'Untitled Note');
            setNoteTitles((prev) => ({
              ...prev,
              [note.id]: note.title || 'Untitled',
            }));
          } else {
            setActiveNoteContent('');
            setActiveNoteTitle('');
            setNoteTitles((prev) => {
              const newTitles = { ...prev };
              delete newTitles[selectedNoteId];
              return newTitles;
            });
          }
        } catch (error: unknown) {
          console.error(`Failed to load note ${selectedNoteId}:`, error);
          let errorMessage = `Failed to load note content.`;
          if (error instanceof Error) {
            errorMessage = error.message;
          }
          toast({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive',
          });
          setActiveNoteContent('');
          setActiveNoteTitle('');
        }
      } else {
        setActiveNoteContent('');
        setActiveNoteTitle('');
      }
    };
    loadActiveNoteContent();
  }, [selectedNoteId, toast]);

  // Function to handle opening a note in a new tab
  const handleOpenNoteInTab = useCallback(
    async (noteId: string) => {
      if (!openNoteIds.includes(noteId)) {
        setOpenNoteIds((prev) => [...prev, noteId]);
      }
      setSelectedNoteId(noteId);
    },
    [openNoteIds, setSelectedNoteId],
  );

  // Function to handle closing a note tab
  const handleCloseNoteTab = useCallback(
    (noteIdToClose: string) => {
      setOpenNoteIds((prev) => {
        const newOpenNoteIds = prev.filter((id) => id !== noteIdToClose);
        // If the closed tab was the active one, select a new active tab
        if (selectedNoteId === noteIdToClose) {
          setSelectedNoteId(
            newOpenNoteIds.length > 0 ? newOpenNoteIds[0] : null,
          );
        }
        return newOpenNoteIds;
      });
      setNoteTitles((prev) => {
        const newTitles = { ...prev };
        delete newTitles[noteIdToClose];
        return newTitles;
      });
    },
    [selectedNoteId, setSelectedNoteId],
  );

  const handleDeleteNoteClick = async (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      setIsLoading(true); // Set loading to true before deletion
      try {
        await handleDeleteNote(noteId);
        setSelectedNoteId(null);
        setSelectedNoteIds((prev) => prev.filter((id) => id !== noteId));
        handleCloseNoteTab(noteId);
        await fetchCategories();
        toast({
          title: 'Success',
          description: 'Note deleted successfully.',
        });
      } catch (error: unknown) {
        console.error(`Failed to delete note with ID ${noteId}:`, error);
        let errorMessage = 'Failed to delete note.';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false); // Set loading to false after deletion
      }
    }
  };

  const handleBulkCategoryAssign = async () => {
    if (!bulkCategory || selectedNoteIds.length === 0) {
      toast({
        title: 'Info',
        description: 'Please select notes and a category.',
        variant: 'default',
      });
      return;
    }

    setIsLoading(true); // Set loading to true before bulk assign
    try {
      for (const noteId of selectedNoteIds) {
        const noteToUpdate = await getNote(noteId);
        if (noteToUpdate) {
          await handleUpdateNote(
            noteId,
            noteToUpdate.title,
            noteToUpdate.markdown,
            bulkCategory,
          );
        }
      }
      toast({
        title: 'Success',
        description: `Assigned category "${bulkCategory}" to selected notes.`,
      });
      setSelectedNoteIds([]);
      setBulkCategory('');
      await fetchCategories();
    } catch (error: unknown) {
      console.error('Failed to assign bulk category:', error);
      let errorMessage = 'Failed to assign category to selected notes.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false); // Set loading to false after bulk assign
    }
  };

  const handleBulkDelete = async () => {
    if (selectedNoteIds.length === 0) {
      toast({
        title: 'Info',
        description: 'Please select notes to delete.',
        variant: 'default',
      });
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to delete ${selectedNoteIds.length} selected notes?`,
      )
    ) {
      setIsLoading(true); // Set loading to true before bulk delete
      try {
        for (const noteId of selectedNoteIds) {
          await handleDeleteNote(noteId);
        }
        toast({
          title: 'Success',
          description: `${selectedNoteIds.length} notes deleted successfully.`,
        });
        setSelectedNoteId(null);
        setSelectedNoteIds([]);
        await fetchCategories();
      } catch (error: unknown) {
        console.error('Failed to bulk delete notes:', error);
        let errorMessage = 'Failed to delete selected notes.';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false); // Set loading to false after bulk delete
      }
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex space-x-4 mb-4">
        <SearchBar />
        <CategorySelector />
      </div>

      {/* Tabbed interface for open notes */}
      {openNoteIds.length > 0 && (
        <MarkdownTabs
          openNoteIds={openNoteIds}
          activeNoteId={selectedNoteId}
          onTabChange={setSelectedNoteId}
          onTabClose={handleCloseNoteTab}
          noteTitles={noteTitles}
        />
      )}

      {selectedNoteId ? (
        <MarkdownEditor
          key={selectedNoteId}
          noteId={selectedNoteId}
          initialTitle={activeNoteTitle}
          initialMarkdown={activeNoteContent}
          onSaveSuccess={async () => {}}
          isLoading={isLoading} // Pass isLoading prop
        />
      ) : (
        <div className="p-4 text-center text-muted-foreground">
          Select a note or create a new one.
        </div>
      )}

      <NoteListAndActions
        notes={notes}
        selectedNoteIds={selectedNoteIds}
        setSelectedNoteIds={setSelectedNoteIds}
        onNoteClick={handleOpenNoteInTab}
        handleDeleteNoteClick={handleDeleteNoteClick}
        handleBulkCategoryAssign={handleBulkCategoryAssign}
        handleBulkDelete={handleBulkDelete}
        allCategories={allCategories}
        bulkCategory={bulkCategory}
        setBulkCategory={setBulkCategory}
        isLoading={isLoading} // Pass isLoading to NoteListAndActions
      />
    </div>
  );
};

export default NotesTabContent;
