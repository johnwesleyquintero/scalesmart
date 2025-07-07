import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SaveRequestDialogProps {
  showSaveDialog: boolean;
  setShowSaveDialog: (show: boolean) => void;
  newRequestName: string;
  setNewRequestName: (name: string) => void;
  confirmSaveRequest: () => void;
}

const SaveRequestDialog: React.FC<SaveRequestDialogProps> = ({
  showSaveDialog,
  setShowSaveDialog,
  newRequestName,
  setNewRequestName,
  confirmSaveRequest,
}) => {
  return (
    <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Save Request</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter a name for your saved request.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="requestName" className="text-right">
              Name
            </Label>
            <Input
              id="requestName"
              value={newRequestName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewRequestName(e.target.value)
              }
              className="col-span-3 bg-background border-border"
              placeholder="e.g., My Common Bug Fix Request"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={confirmSaveRequest}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveRequestDialog;
