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
          <DialogDescription>
            Exciting Updates for Enhanced Analysis and Experience!
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <h4 className="font-semibold text-lg">
            Enhanced Data Visualization & Table Interaction
          </h4>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            <li>
              New charts visualizing sales and advertising performance with
              flexible filter control data set!
            </li>
            <li>
              Enhanced CSV Data-Table feature with per-column settings, custom
              sort functions, and persistent state for user preferences.
            </li>
            <li>
              New toggleable Keyword Performance Overview Table for granular
              insights.
            </li>
          </ul>

          <h4 className="font-semibold text-lg">
            Improved CSV Data Mapping & Error Handling
          </h4>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            <li>
              Easier upload and mapping with the new CSV Data Mapper, including
              robust data validation and transformation configuration.
            </li>
            <li>
              Detailed, row-level error information for CSV uploads and improved
              loading indicators, offering clearer user feedback.
            </li>
            <li>
              Robust date sorting for CSV data to handle invalid date values
              gracefully.
            </li>
          </ul>

          <h4 className="font-semibold text-lg">
            General UI & UX Enhancements
          </h4>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            <li>
              Standardized application-wide status notifications using the
              `use-toast` hook for consistent and informative feedback.
            </li>
            <li>
              Print and Download PDF options for easily sharing dashboard
              insights.
            </li>
            <li>
              Listing Quality Checker now uses `shadcn/ui` Card components for
              consistent and improved visual presentation.
            </li>
            <li>
              Dashboard now loads sample data when no CSV is uploaded, allowing
              immediate exploration.
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
