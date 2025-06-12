import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
} from 'react';
import {
  addNote,
  updateNote,
  deleteNote,
  getNote, // Import getNote
  addNoteVersion,
  getNoteVersions,
  cleanOldNoteVersions,
  deleteAllNoteVersions,
  getNotesByCategory, // Import getNotesByCategory
  searchNotes, // Import searchNotes
  getNoteCountsByCategory as fetchNoteCountsByCategoryFromDB, // Import getNoteCountsByCategory
} from '@/lib/indexeddb/markdown-notepad-db';
import { useToast } from '@/hooks/use-toast';
import { useMarkdownCategories } from '@/hooks/use-markdown-categories'; // Import the new hook
import { Category, Note, MarkdownNoteVersion } from '@/types/indexeddb'; // Import Category, Note, and MarkdownNoteVersion types

interface MarkdownNotepadContextType {
  category: string;
  setCategory: (category: string) => void;
  searchQuery: string;
  setSearchQuery: (searchQuery: string) => void;
  allCategories: Category[]; // Now an array of Category objects
  createNewNote: () => Promise<string>;
  handleAddCategory: (name: string) => Promise<void>;
  handleUpdateCategory: (category: Category) => Promise<void>;
  handleDeleteCategory: (id: string) => Promise<void>;
  fetchCategories: () => Promise<void>; // Expose fetchCategories
  // New version history functions
  fetchNoteVersions: (noteId: string) => Promise<MarkdownNoteVersion[]>;
  restoreNoteVersion: (
    noteId: string,
    versionMarkdown: string,
  ) => Promise<void>;
  handleUpdateNote: (
    id: string,
    title: string,
    markdown: string,
    category: string,
  ) => Promise<void>;
  handleDeleteNote: (id: string) => Promise<void>;
  fetchNotesContent: () => Promise<Note[]>;
  getNoteCountsByCategory: () => Promise<Map<string, number>>;
}

const MarkdownNotepadContext = createContext<
  MarkdownNotepadContextType | undefined
>(undefined);

export const MarkdownNotepadProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Use the new markdown categories hook
  const {
    categories: allCategories,
    fetchCategories,
    handleAddCategoryAction,
    handleUpdateCategoryAction,
    handleDeleteCategoryAction,
  } = useMarkdownCategories();

  const createNewNote = useCallback(async () => {
    try {
      const defaultTitle = 'New Note';
      const newCategoryName =
        category === 'all' ? 'uncategorized' : category || 'uncategorized';

      // Ensure the category exists before adding the note
      const existingCategory = allCategories.find(
        (cat) => cat.name === newCategoryName,
      );
      if (!existingCategory && newCategoryName !== 'uncategorized') {
        // If category doesn't exist, add it. The addNote function will also ensure it exists.
        // This is a redundant check but good for explicit flow.
        await handleAddCategoryAction(newCategoryName);
      }

      const newNoteId = await addNote(defaultTitle, '', newCategoryName);
      toast({
        title: 'Success',
        description: 'New note created.',
      });
      await fetchCategories(); // Refresh categories after creating a new note
      return newNoteId;
    } catch (error: unknown) {
      console.error('Failed to create new note:', error);
      let errorMessage = 'Failed to create new note.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  }, [
    category,
    toast,
    fetchCategories,
    allCategories,
    handleAddCategoryAction,
  ]);

  const fetchNoteVersions = useCallback(
    async (noteId: string) => {
      try {
        return await getNoteVersions(noteId);
      } catch (error: unknown) {
        console.error(`Failed to fetch versions for note ${noteId}:`, error);
        toast({
          title: 'Error',
          description: 'Failed to load note versions.',
          variant: 'destructive',
        });
        return [];
      }
    },
    [toast],
  );

  const restoreNoteVersion = useCallback(
    async (noteId: string, versionMarkdown: string) => {
      try {
        // First, get the existing note to preserve its title and category
        const existingNote = await getNote(noteId);
        if (!existingNote) {
          throw new Error(`Note with ID ${noteId} not found for restoration.`);
        }
        await updateNote(
          noteId,
          existingNote.title, // Preserve original title
          versionMarkdown,
          existingNote.category, // Preserve original category
        );
        toast({
          title: 'Success',
          description: 'Note restored to selected version.',
        });
      } catch (error: unknown) {
        console.error(`Failed to restore note version for ${noteId}:`, error);
        toast({
          title: 'Error',
          description: 'Failed to restore note version.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast],
  );

  const handleUpdateNote = useCallback(
    async (id: string, title: string, markdown: string, category: string) => {
      try {
        await updateNote(id, title, markdown, category);
        await addNoteVersion(id, markdown); // Save a new version on update
        await cleanOldNoteVersions(id); // Clean up old versions
        toast({
          title: 'Success',
          description: 'Note updated.',
        });
      } catch (error: unknown) {
        console.error(`Failed to update note ${id}:`, error);
        toast({
          title: 'Error',
          description: 'Failed to update note.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast],
  );

  const handleDeleteNote = useCallback(
    async (id: string) => {
      try {
        await deleteNote(id);
        await deleteAllNoteVersions(id); // Delete all versions when the note is deleted
        toast({
          title: 'Success',
          description: 'Note deleted.',
        });
      } catch (error: unknown) {
        console.error(`Failed to delete note ${id}:`, error);
        toast({
          title: 'Error',
          description: 'Failed to delete note.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast],
  );

  // Function to fetch notes based on current category and search query
  const fetchNotesContent = useCallback(async () => {
    try {
      let loadedNotes: Note[] = [];
      if (category && category !== 'all') {
        loadedNotes = await getNotesByCategory(category, searchQuery);
      } else {
        loadedNotes = await searchNotes(searchQuery);
      }
      // setNotes(loadedNotes || []); // State is now managed in NotesTabContent
      return loadedNotes || [];
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
      throw error; // Re-throw to be handled by the component
    }
  }, [category, searchQuery, toast]);

  const getNoteCountsByCategory = useCallback(async () => {
    try {
      // Assuming there's an imported function named getNoteCountsByCategory
      // that actually fetches the data. If not, this needs to be defined elsewhere.
      return await fetchNoteCountsByCategoryFromDB();
    } catch (error: unknown) {
      console.error('Failed to get note counts by category:', error);
      toast({
        title: 'Error',
        description: 'Failed to get note counts by category.',
        variant: 'destructive',
      });
      return new Map<string, number>(); // Return an empty map in case of error
    }
  }, [toast]);

  return (
    <MarkdownNotepadContext.Provider
      value={{
        category,
        setCategory,
        searchQuery,
        setSearchQuery,
        allCategories,
        createNewNote,
        handleAddCategory: handleAddCategoryAction,
        handleUpdateCategory: handleUpdateCategoryAction,
        handleDeleteCategory: handleDeleteCategoryAction,
        fetchCategories,
        fetchNoteVersions,
        restoreNoteVersion,
        handleUpdateNote,
        handleDeleteNote,
        fetchNotesContent,
        getNoteCountsByCategory,
      }}
    >
      {children}
    </MarkdownNotepadContext.Provider>
  );
};

export const useMarkdownNotepadContext = () => {
  const context = useContext(MarkdownNotepadContext);
  if (!context) {
    throw new Error(
      'useMarkdownNotepadContext must be used within a MarkdownNotepadProvider',
    );
  }
  return context;
};
