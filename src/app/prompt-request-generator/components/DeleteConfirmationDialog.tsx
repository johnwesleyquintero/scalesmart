import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { SavedRequest } from '@/lib/prompt-generator/types';

interface DeleteConfirmationDialogProps {
  requestPendingDeletion: SavedRequest | null;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  requestPendingDeletion,
  onConfirmDelete,
  onCancelDelete,
}) => {
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) onCancelDelete();
  };

  return (
    <AlertDialog
      open={!!requestPendingDeletion}
      onOpenChange={handleOpenChange}
    >
      <AlertDialogContent className="sm:max-w-[400px] border-border">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40 flex-shrink-0">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <AlertDialogTitle className="text-foreground text-base">
              Delete saved request?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-muted-foreground text-sm pl-[52px]">
            This will permanently remove{' '}
            <span className="font-semibold text-foreground">
              &ldquo;{requestPendingDeletion?.name}&rdquo;
            </span>
            . This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel
            onClick={onCancelDelete}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmDelete}
            className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white focus:ring-red-500"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmationDialog;
