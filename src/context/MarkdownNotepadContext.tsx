import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
} from 'react';
import { addNote } from '@/lib/indexeddb/markdown-notepad-db';
import { useToast } from '@/hooks/use-toast';
import { useMarkdownCategories } from '@/hooks/use-markdown-categories'; // Import the new hook
import { Category } from '@/types/indexeddb'; // Import Category type

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
