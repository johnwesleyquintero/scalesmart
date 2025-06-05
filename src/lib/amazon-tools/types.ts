export interface DashboardMetrics {
  date: string; // YYYY-MM-DD
  unique_identifier: string; // ASIN, SKU, etc.
  total_sales?: number;
  total_orders?: number;
  total_sessions?: number;
  total_page_views?: number;
  total_conversion_rate?: number;
  ad_impressions?: number;
  ad_clicks?: number;
  ad_spend?: number;
  ad_sales?: number;
  ad_orders?: number;
  acos?: number;
  roas?: number;
  cpc?: number;
  ctr?: number;
  ad_conversion_rate?: number;
  profit?: number;
  inventory_level?: number;
  review_rating?: number;
  cac?: number;
  ltv?: number;
  targeted_keyword?: string; // From 'Targeted Keyword'
  keyword_ad_impressions?: number; // From 'Keyword Ad Impressions'
  keyword_ad_clicks?: number; // From 'Keyword Ad Clicks'
  keyword_ad_spend?: number; // From 'Keyword Ad Spend'
  keyword_ad_sales_7_day?: number; // From 'Keyword Ad Sales (7-day)' (keyword specific)
  keyword_ad_orders_7_day?: number; // From 'Keyword Ad Orders (7-day)' (keyword specific)
  asin?: string;
  keyword?: string;
  [key: string]: unknown; // Allow for other properties

  // Validation and Outlier Flags
  date_validation_warning?: boolean;
  unique_identifier_validation_warning?: boolean;
  total_sales_outlier_flag?: boolean;
  total_orders_outlier_flag?: boolean;
  total_sessions_outlier_flag?: boolean;
  total_page_views_outlier_flag?: boolean;
  total_conversion_rate_outlier_flag?: boolean;
  ad_impressions_outlier_flag?: boolean;
  ad_clicks_outlier_flag?: boolean;
  ad_spend_outlier_flag?: boolean;
  ad_sales_outlier_flag?: boolean;
  ad_orders_outlier_flag?: boolean;
  acos_outlier_flag?: boolean;
  roas_outlier_flag?: boolean;
  cpc_outlier_flag?: boolean;
  ctr_outlier_flag?: boolean;
  ad_conversion_rate_outlier_flag?: boolean;
  profit_outlier_flag?: boolean;
  inventory_level_outlier_flag?: boolean;
  review_rating_outlier_flag?: boolean;
  cac_outlier_flag?: boolean;
  ltv_outlier_flag?: boolean;
  targeted_keyword_validation_warning?: boolean;
  keyword_ad_impressions_outlier_flag?: boolean;
  keyword_ad_clicks_outlier_flag?: boolean;
  keyword_ad_spend_outlier_flag?: boolean;
  keyword_ad_sales_7_day_outlier_flag?: boolean;
  keyword_ad_orders_7_day_outlier_flag?: boolean;
  asin_validation_warning?: boolean;
  keyword_validation_warning?: boolean;
}

import {
  TARGET_METRICS_CONFIG,
  MetricTypes,
} from '@/config/amazon-tools-config';

/**
 * Defines the union of all possible metric keys based on the TARGET_METRICS_CONFIG.
 * This ensures type safety and consistency with the defined metrics.
 */
export type MetricKey = (typeof TARGET_METRICS_CONFIG)[number]['key'];

export interface TargetMetricConfig {
  key: MetricKey;
  label: string;
  required: boolean;
  expectedType: (typeof MetricTypes)[keyof typeof MetricTypes];
  hint?: string;
  group?: string;
}

export type TimeRange =
  | 'last_7_days'
  | 'last_30_days'
  | 'month_to_date'
  | 'year_to_date'
  | 'all_time'
  | 'custom';

export interface DashboardViewPreferences {
  timeGranularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  timeRange: TimeRange;
  customDateRange?: {
    from: Date | undefined;
    to: Date | undefined;
  };
}
