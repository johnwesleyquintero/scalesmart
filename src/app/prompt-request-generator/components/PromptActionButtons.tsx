import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Wand2,
  Save,
  Undo2,
  Redo2,
  Trash2,
  HelpCircle,
  FileDown,
  FileUp,
  RefreshCw,
} from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { SavedRequest } from './types';
import { SavedRequestsPanel } from './SavedRequestsPanel';

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
  selectedSavedRequestId?: string | null;
  handleLoadRequest: (id: string) => void;
  handleDeleteRequest: (id: string) => void;
  handleUpdateRequest: (id: string, name: string) => void;
  handleUpdateRequestData?: (id: string) => void;
  handleOpenGuide: () => void;
  handleExportAll?: () => void;
  handleImportAll?: () => void;
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
  selectedSavedRequestId,
  handleLoadRequest,
  handleDeleteRequest,
  handleUpdateRequest,
  handleUpdateRequestData,
  handleOpenGuide,
  handleExportAll,
  handleImportAll,
}) => {
  const activeRequest = selectedSavedRequestId
    ? savedRequests?.find((r) => r.id === selectedSavedRequestId)
    : null;

  return (
    <div className="flex flex-col gap-3 pt-4 border-t border-border/50">
      {/* Active request indicator */}
      {activeRequest && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-purple-50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40 text-xs text-purple-700 dark:text-purple-300">
          <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
          <span className="flex-1 truncate font-medium">
            Editing: {activeRequest.name}
          </span>
          {handleUpdateRequestData && (
            <button
              onClick={() => handleUpdateRequestData(activeRequest.id)}
              className="flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 font-semibold transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Update
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Primary: Generate */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button
            onClick={generatePromptHandler}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 shadow-md shadow-purple-200/50 dark:shadow-none transition-all duration-200"
            disabled={isGenerateDisabled || loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span>Generating…</span>
              </div>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Structured Prompt
              </>
            )}
          </Button>
        </div>

        {/* Utility toolbar */}
        <div className="flex items-center gap-2">
          <TooltipProvider delayDuration={400}>
            <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-md border border-border/50">
              {/* Undo / Redo */}
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

              <div className="w-px h-4 bg-border/50 mx-0.5" />

              {/* Save */}
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

              {/* Saved requests panel */}
              <SavedRequestsPanel
                loading={loading}
                savedRequests={savedRequests}
                selectedSavedRequestId={selectedSavedRequestId}
                handleLoadRequest={handleLoadRequest}
                handleDeleteRequest={handleDeleteRequest}
                handleUpdateRequest={handleUpdateRequest}
                handleUpdateRequestData={handleUpdateRequestData}
              />

              <div className="w-px h-4 bg-border/50 mx-0.5" />

              {/* Export */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleExportAll}
                    disabled={!savedRequests?.length}
                    className={cn(
                      'h-8 w-8 text-muted-foreground hover:text-foreground',
                      !savedRequests?.length && 'opacity-40',
                    )}
                    aria-label="Export all saved requests as JSON"
                  >
                    <FileDown className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export All (JSON)</TooltipContent>
              </Tooltip>

              {/* Import */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleImportAll}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    aria-label="Import requests from JSON"
                  >
                    <FileUp className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Import JSON</TooltipContent>
              </Tooltip>

              <div className="w-px h-4 bg-border/50 mx-0.5" />

              {/* Guide */}
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

              {/* Clear */}
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
    </div>
  );
};

export default PromptActionButtons;
