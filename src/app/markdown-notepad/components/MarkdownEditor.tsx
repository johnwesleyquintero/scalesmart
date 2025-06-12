'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { jsPDF } from 'jspdf';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkHtml from 'remark-html';
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
import VersionHistoryDialog from './VersionHistoryDialog';

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
          <Button
            onClick={async () => {
              try {
                const html = String(
                  await unified()
                    .use(remarkParse)
                    .use(remarkHtml)
                    .process(markdown),
                );
                const blob = new Blob([html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${title}.html`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } catch (error) {
                toast({
                  title: 'Error',
                  description: 'Failed to export to HTML.',
                  variant: 'destructive',
                });
              }
            }}
            disabled={isLoading}
          >
            Export to HTML
          </Button>
          <Button
            onClick={async () => {
              try {
                const html = String(
                  await unified()
                    .use(remarkParse)
                    .use(remarkHtml)
                    .process(markdown),
                );

                // Create a temporary element to render the HTML
                const tempElement = document.createElement('div');
                tempElement.innerHTML = html;
                tempElement.style.width = '595px'; // A4 width in pixels
                tempElement.style.position = 'absolute';
                tempElement.style.top = '0';
                tempElement.style.left = '0';
                tempElement.style.padding = '20px';
                document.body.appendChild(tempElement);

                // Import html2canvas here to avoid errors if it's not already imported
                const html2canvas = (await import('html2canvas')).default;

                const pdf = new jsPDF('p', 'mm', 'a4'); // portrait, millimeters, A4
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();

                let currentHeight = 0;

                while (currentHeight < tempElement.scrollHeight) {
                  // Set the top style to move the content for each page
                  tempElement.style.top = `-${currentHeight}px`;

                  // Use html2canvas to render the HTML to a canvas
                  const canvas = await html2canvas(tempElement, {
                    scale: 2, // Increase scale for better resolution
                    y: currentHeight,
                    height: pageHeight * 2, // Double the height for scale
                  });

                  const imgData = canvas.toDataURL('image/png');
                  const imgWidth = pageWidth;
                  const imgHeight = (canvas.height * imgWidth) / canvas.width;

                  if (currentHeight > 0) {
                    pdf.addPage();
                  }

                  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

                  currentHeight += pageHeight * 2; // Move to the next page
                }

                document.body.removeChild(tempElement);
                pdf.save(`${title}.pdf`);
              } catch (error) {
                console.error('Failed to export to PDF:', error);
                toast({
                  title: 'Error',
                  description: 'Failed to export to PDF.',
                  variant: 'destructive',
                });
              }
            }}
          >
            Export to PDF
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
