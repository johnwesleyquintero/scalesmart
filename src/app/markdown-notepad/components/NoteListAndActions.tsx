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
import BulkActions from './BulkActions';

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
  isLoading: boolean; // Add isLoading prop
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
  isLoading, // Destructure isLoading prop
}) => {
  const { toast } = useToast();

  const handleNoteSelect = (noteId: string, isSelected: boolean) => {
    setSelectedNoteIds((prev) =>
      isSelected ? [...prev, noteId] : prev.filter((id) => id !== noteId),
    );
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4">All Notes</h2>
      {notes.length > 0 && (
        <BulkActions
          selectedNoteIds={selectedNoteIds}
          setSelectedNoteIds={setSelectedNoteIds}
          handleBulkCategoryAssign={handleBulkCategoryAssign}
          handleBulkDelete={handleBulkDelete}
          allCategories={allCategories}
          bulkCategory={bulkCategory}
          setBulkCategory={setBulkCategory}
          isLoading={isLoading}
          notes={notes}
        />
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
                disabled={isLoading} // Disable checkbox when loading
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
                disabled={isLoading} // Disable delete button when loading
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
