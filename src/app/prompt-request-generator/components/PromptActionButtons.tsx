import React from 'react';
import { Button } from '@/components/ui/button';
import { Wand2, Save, Undo2, Redo2, Trash2, HelpCircle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SavedRequest } from './types';
import { SavedRequestsDropdown } from './SavedRequestsDropdown';

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
                  aria-label="Undo last change"
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
                  aria-label="Redo last change"
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
                  aria-label="Save current request"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save Request</TooltipContent>
            </Tooltip>

            <SavedRequestsDropdown
              loading={loading}
              savedRequests={savedRequests}
              handleLoadRequest={handleLoadRequest}
              handleDeleteRequest={handleDeleteRequest}
              handleUpdateRequest={handleUpdateRequest}
            />

            <div className="w-px h-4 bg-border/50 mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleOpenGuide}
                  className="h-8 w-8 text-muted-foreground hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                  aria-label="Open user guide"
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
                  className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  aria-label="Clear all form fields"
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
