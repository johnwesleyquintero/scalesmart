// src/components/amazon-seller-tools/overview/OverviewLoadingIndicator.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface OverviewLoadingIndicatorProps {
  isUploading: boolean;
  isParsing: boolean;
  isProcessing: boolean;
  showMapperText: boolean;
}

export const OverviewLoadingIndicator: React.FC<
  OverviewLoadingIndicatorProps
> = ({ isUploading, isParsing, isProcessing, showMapperText }) => {
  let message = 'Processing data...';
  if (isUploading) message = 'Uploading file...';
  else if (isParsing) message = 'Parsing data...';
  else if (showMapperText) message = 'Loading Mapper...';

  return (
    <Card>
      <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
};
