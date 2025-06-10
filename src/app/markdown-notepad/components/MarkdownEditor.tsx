'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMarkdownNotepadContext } from '@/context/MarkdownNotepadContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useToast } from '@/hooks/use-toast';
import useDebounceCallback from '@/hooks/use-debounce-callback';
import { format } from 'date-fns';
import { MarkdownNoteVersion } from '@/types/indexeddb';
import { getNote } from '@/lib/indexeddb/markdown-notepad-db'; // Import getNote

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
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
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
      (title: string, content: string) => {
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
          <Dialog
            open={showVersionHistory}
            onOpenChange={setShowVersionHistory}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                onClick={async () => {
                  const versions = await fetchNoteVersions(noteId);
                  setNoteVersions(versions);
                }}
                disabled={isLoading} // Disable when loading
              >
                Version History
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] h-[500px] flex flex-col">
              <DialogHeader>
                <DialogTitle>Note Version History</DialogTitle>
                <DialogDescription>
                  Select a version to restore your note.
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="flex-grow pr-4">
                {noteVersions.length === 0 ? (
                  <p>No versions available for this note.</p>
                ) : (
                  <div className="space-y-2">
                    {noteVersions.map((version) => (
                      <div
                        key={version.id}
                        className="flex items-center justify-between p-2 border rounded-md"
                      >
                        <span>
                          {format(
                            new Date(version.timestamp),
                            'MMM dd, yyyy HH:mm:ss',
                          )}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            await restoreNoteVersion(noteId, version.markdown);
                            // After restoring, re-fetch the note to get the updated title and content
                            // This ensures consistency with the context's restore logic
                            const updatedNote = await getNote(noteId);
                            if (updatedNote) {
                              setMarkdown(updatedNote.markdown);
                              setTitle(updatedNote.title);
                            }
                            setShowVersionHistory(false); // Close dialog
                          }}
                          disabled={isLoading} // Disable when loading
                        >
                          Restore
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </DialogContent>
          </Dialog>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(markdown);
              toast({
                title: 'Copied!',
                description: 'Markdown content copied to clipboard.',
                duration: 2000, // Short duration for quick feedback
              });
            }}
            disabled={isLoading} // Disable when loading
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
          disabled={isLoading} // Disable textarea when loading
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
