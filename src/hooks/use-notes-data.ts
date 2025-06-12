import { useState, useEffect } from 'react';
import { Note } from '@/types/indexeddb';
import { useMarkdownNotepadContext } from '@/context/MarkdownNotepadContext';

interface UseNotesDataProps {
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useNotesData = ({ setIsLoading }: UseNotesDataProps) => {
  const { category, searchQuery, fetchNotesContent } =
    useMarkdownNotepadContext();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  useEffect(() => {
    const loadNotes = async () => {
      setIsLoading(true);
      try {
        const loadedNotes = await fetchNotesContent();
        setNotes(loadedNotes || []);
      } finally {
        setIsLoading(false);
      }
    };
    loadNotes();
    setSelectedNoteId(null);
  }, [category, searchQuery, fetchNotesContent, setIsLoading]);

  useEffect(() => {
    if (notes.length > 0 && !selectedNoteId) {
      setSelectedNoteId(notes[0].id);
    } else if (notes.length === 0 && selectedNoteId) {
      setSelectedNoteId(null);
    }
  }, [notes, selectedNoteId]);

  return { notes, selectedNoteId, setSelectedNoteId };
};
