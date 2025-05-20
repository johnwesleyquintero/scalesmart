// src/components/shared/sample-csv-button.tsx
import React from 'react';
import { Button } from '@/components/ui/button';

interface SampleCsvButtonProps {
  toolName: string; // e.g., 'keyword-analyzer', 'fba-calculator'
  onClick: () => void;
}

const SampleCsvButton: React.FC<SampleCsvButtonProps> = ({ toolName, onClick }) => {
  const getSampleCsvFileName = () => {
    switch (toolName) {
      case 'keyword-analyzer':
        return 'keyword_list_sample.csv';
      case 'fba-calculator':
        return 'fba_fees_sample.csv';
      case 'ppc-campaign-auditor':
        return 'ppc_campaign_report_sample.csv';
      default:
        return 'sample.csv';
    }
  };

  const sampleCsvFileName = getSampleCsvFileName();

  return (
    <Button onClick={onClick} variant="outline">
      Download Sample CSV for {toolName} ({sampleCsvFileName})
    </Button>
  );
};

export default SampleCsvButton;
