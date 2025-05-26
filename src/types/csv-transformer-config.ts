// src/types/csv-transformer-config.ts
import type { DashboardMetrics } from '@/app/amazon-seller-tools/page';

export type CsvTransformerFieldType = keyof DashboardMetrics; // Type alias for convenience

export interface CsvTransformerFieldConfig {
  id: string; // Changed to string
  label: string;
  required: boolean;
  transform?: (value: unknown) => unknown; // Allow any transform function
}

export type CsvTransformerConfig = CsvTransformerFieldConfig[];
