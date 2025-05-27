// src/components/amazon-seller-tools/overview/OverviewLoadingIndicator.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress'; // Assuming Progress component is available

interface OverviewLoadingIndicatorProps {
  isUploading: boolean;
  isParsing: boolean;
  isProcessing: boolean;
  showMapperText: boolean;
  totalRows?: number; // Total rows detected in CSV
  processedRows?: number; // Number of rows processed so far during transformation
  parsingErrorCount?: number; // Number of transformation errors/warnings found
}

export const OverviewLoadingIndicator: React.FC<
  OverviewLoadingIndicatorProps
> = ({
  isUploading,
  isParsing,
  isProcessing,
  showMapperText,
  totalRows = 0,
  processedRows = 0,
  parsingErrorCount = 0,
}) => {
  let message = '';
  let progress = 0; // In percentage

  if (isUploading) {
    message = 'Uploading file...';
    progress = 10; // Initial arbitrary progress for upload
  } else if (isParsing) {
    message = 'Reading and parsing file headers...';
    progress = 20; // After headers are read, but before full data parse
  } else if (showMapperText) {
    message = 'Loading data mapping interface...';
    progress = 50; // During mapping selection by user
  } else if (isProcessing) {
    message = `Processing data rows...`;
    if (totalRows > 0 && processedRows > 0) {
      message = `Processing ${processedRows} of ${totalRows} rows...`;
      progress = (processedRows / totalRows) * 100;
    }
    if (parsingErrorCount > 0) {
      message += ` (Found ${parsingErrorCount} issues)`;
    }
  }

  return (
    <Card>
      <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground text-center mb-2">
          {message}
        </p>
        {isProcessing && totalRows > 0 && (
          <Progress value={progress} className="w-[80%] max-w-sm h-2" />
        )}
        {parsingErrorCount > 0 && (
          <p className="text-sm text-red-500 mt-2">
            Some data issues detected. Check error report after completion.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
