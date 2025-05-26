// src/app/amazon-seller-tools/page.ts

interface DashboardMetrics {
  date: string;
  unique_identifier?: string; // ASIN, SKU, etc.
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
  [key: string]: unknown;
}

interface TargetMetricConfig {
  key: string;
  label: string;
  required: boolean;
  expectedType: string;
  hint?: string;
  group: string;
}

export type { DashboardMetrics, TargetMetricConfig };
