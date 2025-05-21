// src/components/shared/sample-csv-button.tsx
import React from 'react';
import { Button } from '@/components/ui/button';

interface SampleCsvButtonProps {
  onClick: (fileName: string) => void;
  fileName: string; // The actual filename to download
  buttonText: string; // The text to display on the button
}

const SampleCsvButton: React.FC<SampleCsvButtonProps> = ({
  onClick,
  fileName,
  buttonText,
}) => {
  return (
    <Button onClick={() => onClick(fileName)} variant="outline">
      {buttonText}
    </Button>
  );
};

export default SampleCsvButton;
