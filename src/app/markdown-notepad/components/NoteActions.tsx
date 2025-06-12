import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMarkdownNotepadContext } from '@/context/MarkdownNotepadContext';
import { getNote } from '@/lib/indexeddb/markdown-notepad-db';
import { Note } from '@/types/indexeddb';

interface NoteActionsProps {
  selectedNoteIds: string[];
  setSelectedNoteIds: React.Dispatch<React.SetStateAction<string[]>>;
  bulkCategory: string;
  setBulkCategory: React.Dispatch<React.SetStateAction<string>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedNoteId: React.Dispatch<React.SetStateAction<string | null>>;
  handleCloseNoteTab: (noteId: string) => void;
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
}

const NoteActions: React.FC<NoteActionsProps> = ({
  selectedNoteIds,
  setSelectedNoteIds,
  bulkCategory,
  setBulkCategory,
  setIsLoading,
  setSelectedNoteId,
  handleCloseNoteTab,
  setNotes,
}) => {
  const { toast } = useToast();
  const {
    handleDeleteNote,
    handleUpdateNote,
    fetchNotesContent,
    fetchCategories,
  } = useMarkdownNotepadContext();

  const handleDeleteNoteClick = async (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      setIsLoading(true);
      try {
        await handleDeleteNote(noteId);
        setSelectedNoteId(null);
        setSelectedNoteIds((prev) => prev.filter((id) => id !== noteId));
        handleCloseNoteTab(noteId);
        const loadedNotes = await fetchNotesContent();
        setNotes(loadedNotes || []);
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
        setIsLoading(false);
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

    setIsLoading(true);
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
      setSelectedNoteIds([]);
      setBulkCategory('');
      const loadedNotes = await fetchNotesContent();
      setNotes(loadedNotes || []);
      await fetchCategories();
      toast({
        title: 'Success',
        description: 'Selected notes updated successfully.',
      });
    } catch (error: unknown) {
      console.error('Failed to bulk assign category:', error);
      let errorMessage = 'Failed to bulk assign category.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2 mt-4">
      <Button
        onClick={() =>
          selectedNoteIds.forEach((id) => handleDeleteNoteClick(id))
        }
        disabled={selectedNoteIds.length === 0}
        variant="destructive"
      >
        Delete Selected
      </Button>
      <select
        value={bulkCategory}
        onChange={(e) => setBulkCategory(e.target.value)}
        className="p-2 border rounded-md"
      >
        <option value="">Assign Category</option>
        {/* Render categories dynamically if needed */}
      </select>
      <Button
        onClick={handleBulkCategoryAssign}
        disabled={selectedNoteIds.length === 0 || !bulkCategory}
      >
        Apply Category
      </Button>
    </div>
  );
};

export default NoteActions;
