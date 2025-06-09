import React from 'react';
import { Note, Category } from '@/types/indexeddb';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useToast } from '@/hooks/use-toast';

interface NoteListAndActionsProps {
  notes: Note[];
  selectedNoteIds: string[];
  setSelectedNoteIds: React.Dispatch<React.SetStateAction<string[]>>;
  onNoteClick: (noteId: string) => void; // Changed from setSelectedNoteId
  handleDeleteNoteClick: (noteId: string) => Promise<void>;
  handleBulkCategoryAssign: () => Promise<void>;
  handleBulkDelete: () => Promise<void>;
  allCategories: Category[];
  bulkCategory: string;
  setBulkCategory: React.Dispatch<React.SetStateAction<string>>;
}

const NoteListAndActions: React.FC<NoteListAndActionsProps> = ({
  notes,
  selectedNoteIds,
  setSelectedNoteIds,
  onNoteClick, // Changed from setSelectedNoteId
  handleDeleteNoteClick,
  handleBulkCategoryAssign,
  handleBulkDelete,
  allCategories,
  bulkCategory,
  setBulkCategory,
}) => {
  const { toast } = useToast();

  const handleNoteSelect = (noteId: string, isSelected: boolean) => {
    setSelectedNoteIds((prev) =>
      isSelected ? [...prev, noteId] : prev.filter((id) => id !== noteId),
    );
  };

  const handleExportSelected = () => {
    if (selectedNoteIds.length === 0) {
      toast({
        title: 'Info',
        description: 'Please select notes to export.',
        variant: 'default',
      });
      return;
    }

    const selectedNotes = notes.filter((note) =>
      selectedNoteIds.includes(note.id),
    );
    const json = JSON.stringify(selectedNotes, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
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
  };

  return (
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
                  <SelectItem key={cat.id} value={cat.name} label={cat.name}>
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
            onClick={handleExportSelected}
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
                  onClick={() => onNoteClick(note.id)} // Use onNoteClick
                >
                  {note?.title || 'Untitled Note'}
                </h3>
                <div
                  className="text-sm text-muted-foreground line-clamp-3 overflow-hidden text-ellipsis"
                  onClick={() => onNoteClick(note.id)} // Use onNoteClick
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
                {note.updatedAt && note.createdAt !== note.updatedAt && (
                  <span>
                    {' '}
                    | Updated: {new Date(note.updatedAt).toLocaleDateString()}
                  </span>
                )}
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteNoteClick(note.id)}
              >
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NoteListAndActions;
