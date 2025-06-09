'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MarkdownNotepadProvider,
  useMarkdownNotepadContext,
} from '@/context/MarkdownNotepadContext';
import MarkdownEditor from './components/MarkdownEditor';
import CategorySelector from './components/CategorySelector';
import SearchBar from './components/SearchBar';
import {
  getNotesByCategory,
  searchNotes,
  getNote,
  deleteNote,
  updateNote,
  getAllNotes,
} from '@/lib/indexeddb/markdown-notepad-db';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import remarkGfm from 'remark-gfm';
import { Note } from '@/types/indexeddb';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList } from '@/components/ui/tabs';
import { CRMTabsTrigger } from '@/app/crm/components/CRMTabsTrigger'; // Reusing CRMTabsTrigger for consistency
import { MarkdownCategoryManagementTab } from './components/MarkdownCategoryManagementTab'; // New category management tab

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
    setCategory, // Added setCategory to allow tab changes to update the category filter
    searchQuery,
    createNewNote,
    allCategories,
    fetchCategories, // Added fetchCategories to refresh categories after note operations
  } = useMarkdownNotepadContext();
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteContent, setActiveNoteContent] = useState<string>('');
  const [activeNoteTitle, setActiveNoteTitle] = useState<string>('');
  const { toast } = useToast();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [bulkCategory, setBulkCategory] = useState<string>('');

  const loadNotes = useCallback(async () => {
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
  }, [category, searchQuery, toast]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    const loadSelectedNote = async () => {
      if (selectedNoteId) {
        try {
          const note = await getNote(selectedNoteId);
          setActiveNoteContent(note?.markdown || '');
          setActiveNoteTitle(note?.title || 'Untitled Note');
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
    loadSelectedNote();
  }, [selectedNoteId, toast]);

  const handleDeleteNote = async (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteNote(noteId);
        setSelectedNoteId(null);
        setSelectedNoteIds((prev) => prev.filter((id) => id !== noteId)); // Remove from multi-selection
        await loadNotes(); // Reload notes after deletion
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

  const handleNoteSelect = (noteId: string, isSelected: boolean) => {
    setSelectedNoteIds((prev) =>
      isSelected ? [...prev, noteId] : prev.filter((id) => id !== noteId),
    );
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
          await updateNote(
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
      await loadNotes(); // Reload notes to reflect changes
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
          await deleteNote(noteId);
        }
        toast({
          title: 'Success',
          description: `${selectedNoteIds.length} notes deleted successfully.`,
        });
        setSelectedNoteId(null); // Clear active note if it was deleted
        setSelectedNoteIds([]); // Clear selection
        await loadNotes(); // Reload notes after deletion
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
            <Button
              onClick={async () => {
                const newNoteId = await createNewNote();
                setSelectedNoteId(newNoteId);
              }}
              className="mr-2"
            >
              Create New Note
            </Button>
            <CRMTabsTrigger value="notes">Notes</CRMTabsTrigger>
            <CRMTabsTrigger value="category-management">
              Category Management
            </CRMTabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="space-y-4 mt-4">
            <div className="flex space-x-4 mb-4">
              <SearchBar />
              <CategorySelector />
            </div>

            {selectedNoteId ? (
              <MarkdownEditor
                noteId={selectedNoteId}
                initialTitle={activeNoteTitle}
                initialMarkdown={activeNoteContent}
                onSaveSuccess={loadNotes}
              />
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                Select a note or create a new one.
              </div>
            )}

            <div className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">All Notes</h2>
              {notes.length > 0 && (
                <div className="flex items-center space-x-2 mb-4">
                  <Select onValueChange={setBulkCategory} value={bulkCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Bulk assign category" />
                    </SelectTrigger>
                    <SelectContent>
                      {allCategories
                        .filter((cat) => cat.name !== '')
                        .map((cat) => (
                          <SelectItem
                            key={cat.id}
                            value={cat.name}
                            label={cat.name}
                          >
                            {cat.name}
                          </SelectItem>
                        ))}
                      <SelectItem value="uncategorized" label="Uncategorized">
                        Uncategorized
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleBulkCategoryAssign}
                    disabled={selectedNoteIds.length === 0 || !bulkCategory}
                  >
                    Assign to Selected ({selectedNoteIds.length})
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleBulkDelete}
                    disabled={selectedNoteIds.length === 0}
                  >
                    Delete Selected ({selectedNoteIds.length})
                  </Button>
                  <Button
                    onClick={async () => {
                      const selectedNotes = notes.filter((note) =>
                        selectedNoteIds.includes(note.id),
                      );
                      const json = JSON.stringify(selectedNotes, null, 2);
                      const blob = new Blob([json], {
                        type: 'application/json',
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'markdown_notes.json';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      toast({
                        title: 'Success',
                        description: 'Selected notes exported as JSON.',
                      });
                    }}
                    disabled={selectedNoteIds.length === 0}
                  >
                    Export Selected ({selectedNoteIds.length})
                  </Button>
                </div>
              )}
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notes.map((note) => (
                  <li
                    key={note.id}
                    className="p-4 border border-border bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer flex flex-col justify-between"
                  >
                    <div className="flex items-start">
                      <Checkbox
                        checked={selectedNoteIds.includes(note.id)}
                        onCheckedChange={(checked) =>
                          handleNoteSelect(note.id, checked as boolean)
                        }
                        className="mr-2 mt-1"
                      />
                      <div className="flex-grow min-w-0">
                        <h3
                          className="font-bold mb-2 overflow-hidden text-ellipsis whitespace-nowrap"
                          onClick={() => setSelectedNoteId(note.id)}
                        >
                          {note?.title || 'Untitled Note'}
                        </h3>
                        <div
                          className="text-sm text-muted-foreground line-clamp-3 overflow-hidden text-ellipsis"
                          onClick={() => setSelectedNoteId(note.id)}
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {note?.markdown
                              ? note.markdown.substring(0, 150) + '...'
                              : ''}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(note.createdAt).toLocaleDateString()}
                        {note.updatedAt &&
                          note.createdAt !== note.updatedAt && (
                            <span>
                              {' '}
                              | Updated:{' '}
                              {new Date(note.updatedAt).toLocaleDateString()}
                            </span>
                          )}
                      </p>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="category-management" className="space-y-4 mt-4">
            <MarkdownCategoryManagementTab notes={notes} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MarkdownNotepad;
