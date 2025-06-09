'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MarkdownNotepadProvider,
  useMarkdownNotepadContext,
} from '@/context/MarkdownNotepadContext';
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

const MarkdownNotepad = () => {
  return (
    <MarkdownNotepadProvider>
      <NotepadContent />
    </MarkdownNotepadProvider>
  );
};

const NotepadContent = () => {
  const {
    category,
    setCategory,
    searchQuery,
    createNewNote,
    allCategories,
    fetchCategories,
    handleDeleteNote,
    handleUpdateNote,
  } = useMarkdownNotepadContext();
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteContent, setActiveNoteContent] = useState<string>('');
  const [activeNoteTitle, setActiveNoteTitle] = useState<string>('');
  const { toast } = useToast();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [bulkCategory, setBulkCategory] = useState<string>('');
  const [openNoteIds, setOpenNoteIds] = useState<string[]>([]); // Track open note IDs
  const [noteTitles, setNoteTitles] = useState<{ [key: string]: string }>({}); // Store titles for tabs

  // Function to fetch notes based on current category and search query
  const fetchNotesContent = useCallback(async () => {
    try {
      let loadedNotes: Note[] = [];
      if (category && category !== 'all') {
        loadedNotes = await getNotesByCategory(category, searchQuery);
      } else {
        loadedNotes = await searchNotes(searchQuery);
      }
      setNotes(loadedNotes || []);
    } catch (error: unknown) {
      console.error('Failed to load notes:', error);
      let errorMessage = 'Failed to load notes.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [category, searchQuery, toast]); // Dependencies are only for fetching logic

  // Effect to trigger note fetching and reset selection when category or search query changes
  useEffect(() => {
    fetchNotesContent();
    // Crucially, reset selectedNoteId when category or search query changes
    setSelectedNoteId(null);
  }, [category, searchQuery, fetchNotesContent]); // Explicitly depend on category, searchQuery, and the memoized fetcher

  // Effect to handle automatic selection of the first note or clearing selection
  useEffect(() => {
    if (notes.length > 0 && !selectedNoteId) {
      setSelectedNoteId(notes[0].id);
    } else if (notes.length === 0 && selectedNoteId) {
      // If no notes are loaded, clear the selected note
      setSelectedNoteId(null);
    }
  }, [notes, selectedNoteId]); // Depend on notes and selectedNoteId for this specific logic

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
      try {
        await handleDeleteNote(noteId); // Use context's handleDeleteNote
        setSelectedNoteId(null);
        setSelectedNoteIds((prev) => prev.filter((id) => id !== noteId)); // Remove from multi-selection
        handleCloseNoteTab(noteId); // Close the tab if the note was open
        await fetchNotesContent(); // Reload notes after deletion
        await fetchCategories(); // Refresh categories as a note's category might have been removed
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

    try {
      for (const noteId of selectedNoteIds) {
        const noteToUpdate = await getNote(noteId);
        if (noteToUpdate) {
          await handleUpdateNote(
            // Use context's handleUpdateNote
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
      setSelectedNoteIds([]); // Clear selection
      setBulkCategory(''); // Clear bulk category
      await fetchNotesContent(); // Reload notes to reflect changes
      await fetchCategories(); // Refresh categories as new categories might have been added
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
      try {
        for (const noteId of selectedNoteIds) {
          await handleDeleteNote(noteId); // Use context's handleDeleteNote
        }
        toast({
          title: 'Success',
          description: `${selectedNoteIds.length} notes deleted successfully.`,
        });
        setSelectedNoteId(null); // Clear active note if it was deleted
        setSelectedNoteIds([]); // Clear selection
        await fetchNotesContent(); // Reload notes after deletion
        await fetchCategories(); // Refresh categories
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
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2 text-center">
        Markdown Notepad Dashboard
      </h1>
      <p className="text-center text-muted-foreground mb-8">
        Manage your notes, categories, and search through your markdown content.
      </p>

      <div className="bg-card p-6 rounded-lg shadow-md">
        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="mb-4 flex flex-wrap h-auto justify-start bg-muted">
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="category-management">
              Category Management
            </TabsTrigger>
            <Button
              onClick={async () => {
                const newNoteId = await createNewNote();
                handleOpenNoteInTab(newNoteId); // Open new note in a tab
              }}
              className="ml-2"
            >
              Create New Note
            </Button>
          </TabsList>

          <TabsContent value="notes" className="space-y-4 mt-4">
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
                key={selectedNoteId} // Key is crucial for re-mounting editor when tab changes
                noteId={selectedNoteId}
                initialTitle={activeNoteTitle}
                initialMarkdown={activeNoteContent}
                onSaveSuccess={fetchNotesContent}
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
              onNoteClick={handleOpenNoteInTab} // Changed to onNoteClick
              handleDeleteNoteClick={handleDeleteNoteClick}
              handleBulkCategoryAssign={handleBulkCategoryAssign}
              handleBulkDelete={handleBulkDelete}
              allCategories={allCategories}
              bulkCategory={bulkCategory}
              setBulkCategory={setBulkCategory}
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
