// src/components/amazon-seller-tools/overview/OverviewErrorDisplay.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import type { TransformationError } from '@/lib/utils/amazon/data-transformation'; // Import TransformationError

interface OverviewErrorDisplayProps {
  error: string | null; // Allow error to be null
  onRetryUpload: () => void;
  parsingErrors?: TransformationError[]; // Optional detailed parsing errors
}

export const OverviewErrorDisplay: React.FC<OverviewErrorDisplayProps> = ({
  error,
  onRetryUpload,
  parsingErrors = [],
}) => {
  const hasErrors = error || parsingErrors.length > 0;

  if (!hasErrors) {
    return null;
  }

  const criticalErrors = parsingErrors.filter((err) => err.type === 'error');
  const warnings = parsingErrors.filter((err) => err.type === 'warning');

  return (
    <Card className="border-red-400 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300">
      <CardHeader>
        <CardTitle className="flex items-center text-red-700 dark:text-red-200">
          <AlertTriangle className="h-5 w-5 mr-2" />
          Data Processing Issues
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="mb-3 text-sm">{error}</p>}

        {parsingErrors.length > 0 && (
          <div className="mt-4 border-t pt-4 border-red-200 dark:border-red-700">
            <h5 className="font-semibold mb-2">
              Detailed Report ({parsingErrors.length} issues)
            </h5>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="mb-4">
                  View Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-screen-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Detailed Data Transformation Report</DialogTitle>
                  <DialogDescription>
                    Review specific errors and warnings encountered during CSV
                    processing.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  {criticalErrors.length > 0 && (
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="critical-errors">
                        <AccordionTrigger>
                          <span className="flex items-center text-red-600 font-semibold">
                            <XCircle className="h-4 w-4 mr-2" />
                            Critical Errors ({criticalErrors.length})
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="list-disc pl-5 space-y-1">
                            {criticalErrors.map((err, index) => (
                              <li
                                key={`crit-err-${index}`}
                                className="text-red-700"
                              >
                                <strong>
                                  Row {err.rowNumber + 1}, Column '{err.column}
                                  ':
                                </strong>{' '}
                                {err.message}
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}

                  {warnings.length > 0 && (
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="warnings">
                        <AccordionTrigger>
                          <span className="flex items-center text-yellow-600 font-semibold">
                            <Info className="h-4 w-4 mr-2" />
                            Warnings ({warnings.length})
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="list-disc pl-5 space-y-1">
                            {warnings.map((warn, index) => (
                              <li
                                key={`warn-${index}`}
                                className="text-yellow-700"
                              >
                                <strong>
                                  Row {warn.rowNumber + 1}, Column '
                                  {warn.column}':
                                </strong>{' '}
                                {warn.message}
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}

                  {parsingErrors.length > 0 && (
                    <div className="mt-4 p-3 border rounded-md bg-muted/40">
                      <p className="text-sm text-muted-foreground">
                        Please review these details and adjust your CSV file or
                        mapping as needed for best results.
                      </p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        <div className="mt-4 flex space-x-2">
          <Button onClick={onRetryUpload} variant="secondary">
            Try uploading again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
