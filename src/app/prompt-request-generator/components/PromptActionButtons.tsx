import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Wand2,
  Save,
  Undo2,
  Redo2,
  Trash2,
  FolderOpen,
  HelpCircle,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SavedRequest } from './types';

interface PromptActionButtonsProps {
  isGenerateDisabled: boolean;
  loading: boolean;
  generatePromptHandler: () => void;
  handleSaveRequest: () => void;
  requestInput: string;
  clearForm: () => void;
  undo?: () => void;
  redo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  savedRequests?: SavedRequest[];
  handleLoadRequest: (id: string) => void;
  handleDeleteRequest: (id: string) => void;
  handleUpdateRequest: (id: string, name: string) => void;
  handleOpenGuide: () => void;
}

const PromptActionButtons: React.FC<PromptActionButtonsProps> = ({
  isGenerateDisabled,
  loading,
  generatePromptHandler,
  handleSaveRequest,
  requestInput,
  clearForm,
  undo,
  redo,
  canUndo,
  canRedo,
  savedRequests,
  handleLoadRequest,
  handleDeleteRequest,
  handleUpdateRequest,
  handleOpenGuide,
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
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/50">
      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <Button
          onClick={generatePromptHandler}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 shadow-md shadow-purple-200 dark:shadow-none"
          disabled={isGenerateDisabled || loading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <LoadingSpinner size="sm" />
              <span>Generating...</span>
            </div>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Generate Structured Prompt
            </>
          )}
        </Button>
      </div>

      {/* Utility Actions */}
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-md border border-border/50">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={undo}
                  disabled={!canUndo || loading}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={redo}
                  disabled={!canRedo || loading}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo</TooltipContent>
            </Tooltip>

            <div className="w-px h-4 bg-border/50 mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSaveRequest}
                  disabled={!requestInput.trim() || loading}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save Request</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={
                        loading || !savedRequests || savedRequests.length === 0
                      }
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Load Saved Request</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-80">
                {savedRequests?.map((req) => (
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
                        <span className="truncate flex-1 font-medium">
                          {req.name}
                        </span>
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

            <div className="w-px h-4 bg-border/50 mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleOpenGuide}
                  className="h-8 w-8 text-muted-foreground hover:text-purple-600 hover:bg-purple-50"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>User Guide</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearForm}
                  disabled={loading}
                  className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear Form</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default PromptActionButtons;
