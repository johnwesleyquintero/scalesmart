import React from 'react';
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
      <Select
        value={selectedSavedRequestId || ''}
        onValueChange={handleLoadRequest}
      >
        <SelectTrigger
          id="loadRequest"
          className="bg-background border-border"
          aria-label="Load a previously saved request"
        >
          <SelectValue placeholder="Select a saved request" />
        </SelectTrigger>
        <SelectContent className="bg-background border-border">
          {savedRequests && savedRequests.length > 0 ? (
            savedRequests.map((req) => (
              <SelectItem key={req.id} value={req.id} label={req.name}>
                <div className="flex justify-between items-center w-full">
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
                </div>
              </SelectItem>
            ))
          ) : (
            <SelectItem value="no-requests" disabled label="No saved requests">
              No saved requests
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SavedRequestsDropdown;
