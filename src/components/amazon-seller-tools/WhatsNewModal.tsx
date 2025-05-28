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
              **Advanced Table Interactivity:** The data table now supports
              per-column filtering, custom sorting, and persists your
              preferences across sessions.
            </li>
            <li>
              **Data Context Transfer:** Easily send ASINs/Keywords from tables
              directly to relevant specialized tools for deeper analysis.
            </li>
            <li>
              **Keyword Performance Table:** A new toggleable table in the
              Overview tab provides granular insights into keyword-specific
              metrics.
            </li>
          </ul>

          <h4 className="font-semibold text-lg">
            Improved Data Loading & Processing
          </h4>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            <li>
              **Refined Data Loading:** Clearer options to "Upload Your Data" or
              "Explore Sample Data" with helpful hints for CSV requirements.
            </li>
            <li>
              **Enhanced Processing Feedback:** Detailed, row-level error and
              warning reporting during CSV processing, with improved loading
              indicators for each stage (uploading, parsing, mapping).
            </li>
            <li>
              **Persistent View Preferences:** Your selected time range and
              granularity preferences for the Overview tab are now saved.
            </li>
          </ul>

          <h4 className="font-semibold text-lg">
            General UI & UX Enhancements
          </h4>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            <li>
              **Standardized Notifications:** Integrated consistent status
              notifications using the `use-toast` hook for better feedback.
            </li>
            <li>
              **Print and Download PDF Options:** Easily share dashboard
              insights with new print and download PDF options.
            </li>
            <li>
              **Listing Quality Checker UI:** Now uses `shadcn/ui` Card
              components for consistent and improved visual presentation.
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
