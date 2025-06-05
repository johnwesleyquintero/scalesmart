// src/types/data-mapping.ts
import type { DashboardMetrics } from '@/lib/amazon-tools/types';

// Interface for column-specific transformation rules
export interface ColumnTransformationRules {
  trim?: boolean;
  case?: 'upper' | 'lower' | 'title';
  findReplace?: { find: string; replace: string }[];
  // Add other transformation types here
}

export type CsvColumnMapping = Record<keyof DashboardMetrics, string | null>;

export interface ToolMappingConfig {
  label: string;
  value: string;
}

export interface ToolInput {
  label: string;
  value: string;
}

// Placeholder for UserCsvMappingRecord - to be implemented
export interface UserCsvMappingRecord {
  id?: number;
  toolName: string;
  mapping: CsvColumnMapping;
  timestamp: Date;
  // Add actual properties here based on the data mapping requirements
  transformations?: Record<
    keyof DashboardMetrics,
    ColumnTransformationRules | undefined
  >;
}
