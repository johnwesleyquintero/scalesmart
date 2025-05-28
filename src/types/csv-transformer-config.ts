// src/types/csv-transformer-config.ts
import type { DashboardMetrics } from '@/lib/amazon-tools/types';

export type CsvTransformerFieldType = keyof DashboardMetrics; // Type alias for convenience

export interface CsvTransformerFieldConfig {
  id: string; // Changed to string
  label: string;
  required: boolean;
  transform?: (value: unknown) => unknown; // Allow any transform function
}

export type CsvTransformerConfig = CsvTransformerFieldConfig[];
