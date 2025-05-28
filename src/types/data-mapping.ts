// src/types/data-mapping.ts
import type { DashboardMetrics } from '@/lib/amazon-tools/types';

export interface CsvColumnMapping {
  date: keyof DashboardMetrics | null;
  unique_identifier: keyof DashboardMetrics | null;
  total_sales: keyof DashboardMetrics | null;
  total_orders: keyof DashboardMetrics | null;
  total_sessions: keyof DashboardMetrics | null;
  total_conversion_rate: keyof DashboardMetrics | null;
  ad_impressions: keyof DashboardMetrics | null;
  ad_clicks: keyof DashboardMetrics | null;
  ad_spend: keyof DashboardMetrics | null;
  ad_sales: keyof DashboardMetrics | null;
  ad_orders: keyof DashboardMetrics | null;
  acos: keyof DashboardMetrics | null;
  roas: keyof DashboardMetrics | null;
  cpc: keyof DashboardMetrics | null;
  ctr: keyof DashboardMetrics | null;
  ad_conversion_rate: keyof DashboardMetrics | null;
  profit: keyof DashboardMetrics | null;
  inventory_level: keyof DashboardMetrics | null;
  review_rating: keyof DashboardMetrics | null;
  cac: keyof DashboardMetrics | null;
  ltv: keyof DashboardMetrics | null;
  asin: keyof DashboardMetrics | null;
  keyword: keyof DashboardMetrics | null;
  targeted_keyword: keyof DashboardMetrics | null;
  [key: string]: keyof DashboardMetrics | null | undefined;
}

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
