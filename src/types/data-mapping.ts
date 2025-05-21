// src/types/data-mapping.ts
import type { DashboardMetrics } from '@/app/amazon-seller-tools/page';

export type CsvColumnMapping = Record<string, keyof DashboardMetrics | null>;

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
}
