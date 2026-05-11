import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BookmarkPlus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SaveRequestDialogProps {
  showSaveDialog: boolean;
  setShowSaveDialog: (show: boolean) => void;
  newRequestName: string;
  setNewRequestName: (name: string) => void;
  confirmSaveRequest: () => void;
  /** Optionally pass the raw request text to generate a name suggestion */
  requestText?: string;
}

const MAX_NAME_LENGTH = 60;

function generateSuggestedName(requestText?: string): string {
  if (!requestText?.trim()) return '';
  // Take the first ~40 chars of the request, trimmed cleanly at a word boundary
  const trimmed = requestText.trim().slice(0, 48);
  const lastSpace = trimmed.lastIndexOf(' ');
  return lastSpace > 16 ? trimmed.slice(0, lastSpace) : trimmed;
}

const SaveRequestDialog: React.FC<SaveRequestDialogProps> = ({
  showSaveDialog,
  setShowSaveDialog,
  newRequestName,
  setNewRequestName,
  confirmSaveRequest,
  requestText,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestion = generateSuggestedName(requestText);
  const isValid = newRequestName.trim().length > 0;
  const remaining = MAX_NAME_LENGTH - newRequestName.length;

  // Auto-focus + select input text on open
  useEffect(() => {
    if (showSaveDialog) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 80);
    }
  }, [showSaveDialog]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isValid) {
      e.preventDefault();
      confirmSaveRequest();
    }
  };

  const applySuggestion = () => {
    if (suggestion) setNewRequestName(suggestion);
    inputRef.current?.focus();
  };

  return (
    <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
      <DialogContent className="sm:max-w-[440px] bg-card border-border shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950/40">
              <BookmarkPlus className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <DialogTitle className="text-foreground text-base">
                Save Request
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs mt-0.5">
                Give your prompt a memorable name to find it later
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <div className="relative">
              <Input
                ref={inputRef}
                id="requestName"
                value={newRequestName}
                onChange={(e) =>
                  setNewRequestName(e.target.value.slice(0, MAX_NAME_LENGTH))
                }
                onKeyDown={handleKeyDown}
                className={cn(
                  'bg-background border-border pr-14 transition-all',
                  !isValid &&
                    newRequestName.length > 0 &&
                    'border-red-400 focus-visible:ring-red-400',
                )}
                placeholder="e.g., Fix auth bug in middleware"
                autoComplete="off"
              />
              <span
                className={cn(
                  'absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums',
                  remaining < 10
                    ? 'text-red-500'
                    : remaining < 20
                      ? 'text-amber-500'
                      : 'text-muted-foreground/50',
                )}
              >
                {remaining}
              </span>
            </div>

            {/* Smart suggestion */}
            {suggestion && newRequestName !== suggestion && (
              <button
                type="button"
                onClick={applySuggestion}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 transition-colors group"
              >
                <Sparkles className="h-3 w-3 text-purple-400 group-hover:text-purple-600 transition-colors" />
                <span>Suggest:</span>
                <span className="italic truncate max-w-[260px]">
                  &ldquo;{suggestion}&rdquo;
                </span>
              </button>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="flex-1 sm:flex-none">
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={confirmSaveRequest}
            disabled={!isValid}
            className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
          >
            <BookmarkPlus className="h-4 w-4 mr-1.5" />
            Save Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveRequestDialog;
