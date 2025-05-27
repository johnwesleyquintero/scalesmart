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
  onCloseAction: () => void;
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({
  isOpen,
  onCloseAction,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>What's New in Amazon Seller Tools!</DialogTitle>
          <DialogDescription>Enhanced Table Filters</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <h4 className="font-semibold text-lg">
            Enhanced Data Visualization & Table Interaction
          </h4>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            <li>
              New charts visualizing sales and advertising performance with
              filter control data set!
            </li>
            <li>
              Enhanced CSV Data-Table feature with per-column settings.
            </li>
          </ul>

          <h4 className="font-semibold text-lg">
            Improved CSV Data Mapping & Error Handling
          </h4>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            <li>
              Easier upload and mapping with the new CSV Data Mapper, including
              data validation and transformation configuration.
            </li>
            <li>Detailed, row-level error information for CSV uploads.</li>
          </ul>

          <h4 className="font-semibold text-lg">Print and Download PDF</h4>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            <li>Options to share dashboards easily.</li>
          </ul>

          <h4 className="font-semibold text-lg">Sample Data</h4>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            <li>Dashboard loads sample data when no CSV is uploaded.</li>
          </ul>
        </div>
        <DialogFooter>
          <Button onClick={onCloseAction}>Got it!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
