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
    if (!isOpen) {
      onCancelDelete();
    }
  };

  return (
    <AlertDialog
      open={!!requestPendingDeletion}
      onOpenChange={handleOpenChange}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the saved
            request: <strong>{requestPendingDeletion?.name}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancelDelete}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmDelete}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmationDialog;
