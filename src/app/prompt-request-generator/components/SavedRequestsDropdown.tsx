import React from 'react';
import { FolderOpen, Edit2, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SavedRequest } from './types';

interface SavedRequestsDropdownProps {
  loading: boolean;
  savedRequests?: SavedRequest[];
  handleLoadRequest: (id: string) => void;
  handleDeleteRequest: (id: string) => void;
  handleUpdateRequest: (id: string, name: string) => void;
}

export const SavedRequestsDropdown: React.FC<SavedRequestsDropdownProps> = ({
  loading,
  savedRequests,
  handleLoadRequest,
  handleDeleteRequest,
  handleUpdateRequest,
}) => {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');

  const startEditing = (req: SavedRequest) => {
    setEditingId(req.id);
    setEditName(req.name);
  };

  const handleSaveEdit = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (editingId && editName.trim()) {
      handleUpdateRequest(editingId, editName.trim());
      setEditingId(null);
    }
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  if (!savedRequests || savedRequests.length === 0) return null;

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={loading}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <FolderOpen className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Load Saved Request</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-80">
        {savedRequests.map((req) => (
          <DropdownMenuItem
            key={req.id}
            className="flex items-center justify-between group/item p-2"
            onClick={() => !editingId && handleLoadRequest(req.id)}
          >
            {editingId === req.id ? (
              <div
                className="flex items-center gap-1 w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  autoFocus
                  className="flex-1 bg-background border border-input rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-purple-500"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(e);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-green-600 hover:bg-green-50"
                  onClick={handleSaveEdit}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-600 hover:bg-red-50"
                  onClick={cancelEditing}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <span className="truncate flex-1 font-medium">{req.name}</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover/item:opacity-100 hover:text-purple-600 hover:bg-purple-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(req);
                    }}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover/item:opacity-100 hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRequest(req.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
