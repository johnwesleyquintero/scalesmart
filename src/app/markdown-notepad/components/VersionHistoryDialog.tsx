import React from 'react';
import { Button } from '@/components/ui/button';
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
import { format } from 'date-fns';
import { MarkdownNoteVersion } from '@/types/indexeddb';
import { getNote } from '@/lib/indexeddb/markdown-notepad-db';

interface VersionHistoryDialogProps {
  noteId: string;
  isLoading: boolean;
  showVersionHistory: boolean;
  setShowVersionHistory: (show: boolean) => void;
  noteVersions: MarkdownNoteVersion[];
  setNoteVersions: (versions: MarkdownNoteVersion[]) => void;
  setMarkdown: (markdown: string) => void;
  setTitle: (title: string) => void;
}

const VersionHistoryDialog: React.FC<VersionHistoryDialogProps> = ({
  noteId,
  isLoading,
  showVersionHistory,
  setShowVersionHistory,
  noteVersions,
  setNoteVersions,
  setMarkdown,
  setTitle,
}) => {
  const { fetchNoteVersions, restoreNoteVersion } = useMarkdownNotepadContext();

  return (
    <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          onClick={async () => {
            const versions = await fetchNoteVersions(noteId);
            setNoteVersions(versions);
          }}
          disabled={isLoading}
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
                      const updatedNote = await getNote(noteId);
                      if (updatedNote) {
                        setMarkdown(updatedNote.markdown);
                        setTitle(updatedNote.title);
                      }
                      setShowVersionHistory(false);
                    }}
                    disabled={isLoading}
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
  );
};

export default VersionHistoryDialog;
