// src/components/amazon-seller-tools/overview/OverviewDataMapper.tsx
import React from 'react';
import GenericCsvDataMapper from '@/components/shared/GenericCsvDataMapper';
import type { CsvColumnMapping } from '@/types/data-mapping';
import type { TargetMetricConfig } from '@/app/amazon-seller-tools/page'; // Assuming TargetMetricConfig is exported from page.tsx or a types file

interface OverviewDataMapperProps {
  csvHeaders: string[];
  targetMetrics: TargetMetricConfig[]; // Use the imported or defined type
  onApplyMapping: (mapping: CsvColumnMapping) => void;
  sampleDataRow?: Record<string, string>;
  onCancel: () => void;
}

export const OverviewDataMapper: React.FC<OverviewDataMapperProps> = ({
  csvHeaders,
  targetMetrics,
  onApplyMapping,
  sampleDataRow,
  onCancel,
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
  />
);
