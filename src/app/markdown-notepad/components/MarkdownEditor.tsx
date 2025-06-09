'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // Import Select components
import { useMarkdownNotepadContext } from '@/context/MarkdownNotepadContext';
import { updateNote } from '@/lib/indexeddb/markdown-notepad-db';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useToast } from '@/hooks/use-toast';
import useDebounceCallback from '@/hooks/use-debounce-callback';

interface MarkdownEditorProps {
  noteId: string;
  initialTitle: string; // Add initialTitle prop
  initialMarkdown: string;
  onSaveSuccess?: () => void; // Callback for successful save
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  noteId,
  initialTitle,
  initialMarkdown,
  onSaveSuccess,
}) => {
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [title, setTitle] = useState(initialTitle); // State for title
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [noteCategory, setNoteCategory] = useState(''); // State for note's category
  const { category: globalCategory, allCategories } =
    useMarkdownNotepadContext(); // Rename category to globalCategory
  const { toast } = useToast();

  // Update markdown and title state when initialMarkdown/initialTitle prop changes (when switching tabs)
  useEffect(() => {
    setMarkdown(initialMarkdown);
    setTitle(initialTitle);
    // Set initial category from global context, defaulting to 'uncategorized' if globalCategory is 'all' or empty
    setNoteCategory(
      globalCategory === 'all' || !globalCategory
        ? 'uncategorized'
        : globalCategory,
    );
  }, [initialMarkdown, initialTitle, globalCategory]);

  const saveNote = useCallback(
    async (currentTitle: string, content: string, currentCategory: string) => {
      if (noteId) {
        try {
          await updateNote(noteId, currentTitle, content, currentCategory);
          toast({
            title: 'Success',
            description: 'Note saved successfully.',
          });
          onSaveSuccess?.();
        } catch (error: unknown) {
          console.error('Failed to save note:', error);
          let errorMessage = 'Failed to save note.';
          if (error instanceof Error) {
            errorMessage = error.message;
          }
          toast({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive',
          });
        }
      } else {
        console.warn(
          'Attempted to save a new note without a noteId. This functionality is handled by createNewNote in context.',
        );
      }
    },
    [noteId, toast, onSaveSuccess],
  );

  const debouncedSave = useDebounceCallback(
    useCallback(
      (title: string, content: string, category: string) => {
        saveNote(title, content, category);
      },
      [saveNote],
    ),
    1000,
  );

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMarkdown = event.target.value;
    setMarkdown(newMarkdown);
    const newTitle = newMarkdown.split('\n')[0]?.trim() || 'Untitled Note';
    setTitle(newTitle);
    debouncedSave(newTitle, newMarkdown, noteCategory); // Trigger debounced save on change
  };

  const handleCategoryChange = (newCategory: string) => {
    setNoteCategory(newCategory);
    debouncedSave(title, markdown, newCategory); // Trigger debounced save on category change
  };

  const handleManualSave = () => {
    saveNote(title, markdown, noteCategory); // Allow manual save
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <Select onValueChange={handleCategoryChange} value={noteCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {allCategories
              .filter((cat) => cat.name !== '')
              .map((cat) => (
                <SelectItem key={cat.id} value={cat.name} label={cat.name}>
                  {cat.name}
                </SelectItem>
              ))}
            <SelectItem value="uncategorized" label="Uncategorized">
              Uncategorized
            </SelectItem>{' '}
            {/* Option for uncategorized */}
          </SelectContent>
        </Select>
        <div className="flex space-x-2">
          <Toggle
            pressed={viewMode === 'preview'}
            onPressedChange={() =>
              setViewMode((prev) => (prev === 'edit' ? 'preview' : 'edit'))
            }
            aria-label="Toggle preview mode"
          >
            {viewMode === 'edit' ? 'Preview Mode' : 'Edit Mode'}
          </Toggle>
          <Button onClick={handleManualSave}>Save Note</Button>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(markdown);
              toast({
                title: 'Copied!',
                description: 'Markdown content copied to clipboard.',
                duration: 2000, // Short duration for quick feedback
              });
            }}
          >
            Copy Markdown
          </Button>
        </div>
      </div>
      {viewMode === 'edit' ? (
        <Textarea
          value={markdown}
          onChange={handleChange}
          placeholder="Write your markdown here..."
          className="min-h-[300px]"
        />
      ) : (
        <div className="border rounded-md p-4 overflow-y-auto min-h-[300px] prose dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default MarkdownEditor;
