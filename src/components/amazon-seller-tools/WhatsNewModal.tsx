'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface WhatsNewModalProps {
  isOpen: boolean;
  onCloseAction: () => void; // Renamed to follow linter suggestion
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({
  isOpen,
  onCloseAction, // Use the new prop name
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>What's New in Amazon Seller Tools!</DialogTitle>
          <DialogDescription>
            We've added some exciting new features to enhance your experience.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <h4 className="font-semibold text-lg">
            Enhanced Data Interaction & Filtering
          </h4>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            <li>
              **Advanced Filtering for Data Tables:** You can now filter data
              tables by multiple criteria, allowing for more precise data
              exploration.
            </li>
            <li>
              **"Clear All Filters" Button:** A new button has been added to
              quickly reset all active filters in data tables.
            </li>
          </ul>

          <h4 className="font-semibold text-lg">
            Streamlined Specialized Tool Workflows
          </h4>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            <li>
              **"Copy to Clipboard" for Tool Outputs:** Easily copy results from
              specialized tools to your clipboard for quick transfer.
            </li>
            <li>
              **"Save/Load Preset" for Manual Calculation Forms:** Save and load
              frequently used input values for manual calculation forms,
              accelerating repetitive tasks.
            </li>
          </ul>

          <h4 className="font-semibold text-lg">
            Improved User Guidance & Feedback
          </h4>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            <li>
              **Contextual Empty State Messages:** Charts and tables now display
              more informative messages when no data is available, guiding you
              on how to populate them.
            </li>
          </ul>
        </div>
        <DialogFooter>
          <Button onClick={onCloseAction}>Got it!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
