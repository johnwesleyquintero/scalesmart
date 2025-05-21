// src/components/amazon-seller-tools/overview/OverviewErrorDisplay.tsx
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface OverviewErrorDisplayProps {
  error: string;
  onRetryUpload: () => void;
}

export const OverviewErrorDisplay: React.FC<OverviewErrorDisplayProps> = ({
  error,
  onRetryUpload,
}) => (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>
      {error}
      <Button
        variant="link"
        className="p-0 h-auto ml-2 text-destructive"
        onClick={onRetryUpload}
      >
        Try uploading again?
      </Button>
    </AlertDescription>
  </Alert>
);
