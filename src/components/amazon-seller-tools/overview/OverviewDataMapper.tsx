// src/components/amazon-seller-tools/overview/OverviewDataMapper.tsx
import React from 'react';
import GenericCsvDataMapper from '@/components/shared/GenericCsvDataMapper';
import type { CsvColumnMapping } from '@/types/data-mapping';
import type { TargetMetricConfig } from '@/lib/amazon-tools/types';

interface OverviewDataMapperProps {
  csvHeaders: string[];
  targetMetrics: TargetMetricConfig[]; // Use the imported or defined type
  onApplyMapping: (mapping: CsvColumnMapping) => void;
  sampleDataRow?: Record<string, string>;
  onCancel: () => void;
  initialMapping?: CsvColumnMapping; // Add this prop
}

export const OverviewDataMapper: React.FC<OverviewDataMapperProps> = ({
  csvHeaders,
  targetMetrics,
  onApplyMapping,
  sampleDataRow,
  onCancel,
  initialMapping, // Destructure the new prop
}) => (
  <GenericCsvDataMapper
    csvHeaders={csvHeaders}
    targetMetrics={targetMetrics}
    onApplyMapping={onApplyMapping}
    sampleDataRow={sampleDataRow}
    onCancel={onCancel}
    title="Map Report Columns"
    description="Match the columns from your uploaded Report CSV to the required dashboard fields. Required fields are needed for calculations."
    toolName="amazon-overview-dashboard"
    initialMapping={initialMapping} // Pass the new prop to GenericCsvDataMapper
  />
);
