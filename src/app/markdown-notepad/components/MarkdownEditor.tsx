'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useMarkdownNotepadContext } from '@/context/MarkdownNotepadContext';
import { useToast } from '@/hooks/use-toast';
import useDebounceCallback from '@/hooks/use-debounce-callback';
import { format } from 'date-fns';
import { MarkdownNoteVersion } from '@/types/indexeddb';
import { getNote } from '@/lib/indexeddb/markdown-notepad-db'; // Import getNote
import VersionHistoryDialog from './VersionHistoryDialog';
import {
  copyMarkdownToClipboard,
  exportToHtml,
  exportToPdf,
} from '@/lib/markdown-notepad/export-utils'; // Import export utilities

interface MarkdownEditorProps {
  noteId: string;
  initialTitle: string; // Add initialTitle prop
  initialMarkdown: string;
  onSaveSuccess?: () => void; // Callback for successful save
  isLoading: boolean; // Add isLoading prop
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  noteId,
  initialTitle,
  initialMarkdown,
  onSaveSuccess,
  isLoading, // Destructure isLoading prop
}) => {
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [title, setTitle] = useState(initialTitle); // State for title
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('preview');
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [noteVersions, setNoteVersions] = useState<MarkdownNoteVersion[]>([]);
  const {
    category: globalCategory, // Still need globalCategory to set initial title
    handleUpdateNote, // Use handleUpdateNote from context
    fetchNoteVersions,
    restoreNoteVersion,
  } = useMarkdownNotepadContext();
  const { toast } = useToast();

  // Update markdown and title state when initialMarkdown/initialTitle prop changes (when switching tabs)
  useEffect(() => {
    setMarkdown(initialMarkdown);
    setTitle(initialTitle);
  }, [initialMarkdown, initialTitle]);

  const saveNote = useCallback(
    async (currentTitle: string, content: string) => {
      if (noteId) {
        try {
          // When saving from the editor, use the global category from context
          await handleUpdateNote(noteId, currentTitle, content, globalCategory);
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
    [noteId, toast, onSaveSuccess, handleUpdateNote, globalCategory], // Add globalCategory to dependencies
  );

  const debouncedSave = useDebounceCallback(
    useCallback(
      (...args: unknown[]) => {
        const title = args[0] as string;
        const content = args[1] as string;
        saveNote(title, content);
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
    debouncedSave(newTitle, newMarkdown); // Trigger debounced save on change
  };

  const handleManualSave = () => {
    saveNote(title, markdown); // Allow manual save
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-end items-center">
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
          <Button onClick={handleManualSave} disabled={isLoading}>
            Save Note
          </Button>{' '}
          {/* Disable when loading */}
          <VersionHistoryDialog
            noteId={noteId}
            isLoading={isLoading}
            showVersionHistory={showVersionHistory}
            setShowVersionHistory={setShowVersionHistory}
            noteVersions={noteVersions}
            setNoteVersions={setNoteVersions}
            setMarkdown={setMarkdown}
            setTitle={setTitle}
          />
          <Button
            onClick={() => copyMarkdownToClipboard(markdown, toast)}
            disabled={isLoading} // Disable when loading
          >
            Copy Markdown
          </Button>
          <Button
            onClick={() => exportToHtml(markdown, title, toast)}
            disabled={isLoading}
          >
            Export to HTML
          </Button>
          <Button
            onClick={() => exportToPdf(markdown, title, toast)}
            disabled={isLoading}
          >
            Export to PDF
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 h-[600px]">
        {viewMode === 'edit' ? (
          <Textarea
            value={markdown}
            onChange={handleChange}
            placeholder="Write your markdown here..."
            className="min-h-[300px]"
            disabled={isLoading} // Disable textarea when loading
          />
        ) : (
          <div className="border rounded-md p-4 overflow-y-auto min-h-[300px] prose dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {markdown}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownEditor;
