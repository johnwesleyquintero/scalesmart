import React from 'react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandList,
  CommandItem,
} from '@/components/ui/command';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { SavedRequest } from './types'; // Import from new types file

interface SavedRequestsDropdownProps {
  savedRequests: SavedRequest[] | undefined;
  selectedSavedRequestId: string | null;
  handleLoadRequest: (id: string) => void;
  handleDeleteRequest: (id: string) => void;
}

const SavedRequestsDropdown: React.FC<SavedRequestsDropdownProps> = ({
  savedRequests,
  selectedSavedRequestId,
  handleLoadRequest,
  handleDeleteRequest,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="loadRequest">Load Saved Request</Label>
      <Command>
        <CommandInput
          placeholder="Search saved requests..."
          className="h-10 border-border"
        />
        <CommandList className="max-h-64">
          {savedRequests && savedRequests.length > 0 ? (
            savedRequests.map((req) => (
              <CommandItem
                key={req.id}
                value={req.id}
                onSelect={() => handleLoadRequest(req.id)}
                className="justify-between items-center"
              >
                <span>{req.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation(); // Prevent selection when deleting
                    handleDeleteRequest(req.id);
                  }}
                  aria-label={`Delete saved request ${req.name}`}
                  className="ml-2 h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                </Button>
              </CommandItem>
            ))
          ) : (
            <CommandEmpty>No saved requests.</CommandEmpty>
          )}
        </CommandList>
      </Command>
    </div>
  );
};

export default SavedRequestsDropdown;
