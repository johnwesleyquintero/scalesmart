import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Category, Note } from '@/types/indexeddb';
import { useToast } from '@/hooks/use-toast';

interface BulkActionsProps {
  selectedNoteIds: string[];
  setSelectedNoteIds: React.Dispatch<React.SetStateAction<string[]>>;
  handleBulkCategoryAssign: () => Promise<void>;
  handleBulkDelete: () => Promise<void>;
  allCategories: Category[];
  bulkCategory: string;
  setBulkCategory: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  notes: Note[]; // Add notes prop for export functionality
}

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedNoteIds,
  setSelectedNoteIds,
  handleBulkCategoryAssign,
  handleBulkDelete,
  allCategories,
  bulkCategory,
  setBulkCategory,
  isLoading,
  notes,
}) => {
  const { toast } = useToast();

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
        disabled={selectedNoteIds.length === 0 || !bulkCategory || isLoading}
      >
        Assign to Selected ({selectedNoteIds.length})
      </Button>
      <Button
        variant="destructive"
        onClick={handleBulkDelete}
        disabled={selectedNoteIds.length === 0 || isLoading}
      >
        Delete Selected ({selectedNoteIds.length})
      </Button>
      <Button
        onClick={handleExportSelected}
        disabled={selectedNoteIds.length === 0 || isLoading}
      >
        Export Selected ({selectedNoteIds.length})
      </Button>
    </div>
  );
};

export default BulkActions;
