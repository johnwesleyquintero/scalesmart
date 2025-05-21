// src/config/amazon-tools-config.ts
import type {
  DashboardMetrics,
  TargetMetricConfig,
} from '@/app/amazon-seller-tools/page'; // Adjust path if types are moved

// Constants for TargetMetricConfig
export const DATE_TYPE = 'date';
export const STRING_TYPE = 'string';
export const NUMBER_TYPE = 'number';
export const CORE_GROUP = 'Core';
export const OVERALL_PERFORMANCE_GROUP = 'Overall Performance';
export const ADVERTISING_GROUP = 'Advertising';
export const OPERATIONS_GROUP = 'Operations';
export const PRODUCT_HEALTH_GROUP = 'Product Health';
export const GROUP_FINANCIALS = 'Financials'; // Also used in page.tsx, keep here for config consistency

export const TARGET_METRICS_CONFIG_RAW: TargetMetricConfig[] = [
  {
    key: 'date',
    label: 'Date/Period',
    required: true,
    expectedType: DATE_TYPE,
    hint: 'e.g., YYYY-MM-DD or MM/DD/YYYY',
    group: CORE_GROUP,
  },
  {
    key: 'unique_identifier',
    label: 'ASIN / SKU (Unique ID)',
    required: false,
    expectedType: STRING_TYPE,
    hint: 'Product identifier like B00EXAMPLE. Essential for multi-report merging.',
    group: CORE_GROUP,
  },
  {
    key: 'total_sales',
    label: 'Total Sales ($)',
    required: false,
    expectedType: NUMBER_TYPE,
    hint: 'Overall sales for the ASIN (e.g., from Business Report "Ordered product sales")',
    group: OVERALL_PERFORMANCE_GROUP,
  },
  {
    key: 'total_orders',
    label: 'Total Orders/Units',
    required: false,
    expectedType: NUMBER_TYPE,
    hint: 'Overall orders/units for the ASIN (e.g., "Total order items")',
    group: OVERALL_PERFORMANCE_GROUP,
  },
  {
    key: 'total_sessions',
    label: 'Total Sessions',
    required: false,
    expectedType: NUMBER_TYPE,
    hint: 'Overall sessions for the ASIN (e.g., "(Parent ASIN) Sessions" from Business Report)',
    group: OVERALL_PERFORMANCE_GROUP,
  },
  {
    key: 'total_page_views',
    label: 'Total Page Views',
    required: false,
    expectedType: NUMBER_TYPE,
    hint: 'Overall page views for the ASIN (e.g., "(Parent ASIN) Page Views" from Business Report)',
    group: OVERALL_PERFORMANCE_GROUP,
  },
  {
    key: 'ad_impressions',
    label: 'Ad Impressions',
    required: false,
    expectedType: NUMBER_TYPE,
    hint: 'Impressions from advertising reports',
    group: ADVERTISING_GROUP,
  },
  {
    key: 'ad_clicks',
    label: 'Ad Clicks',
    required: false,
    expectedType: NUMBER_TYPE,
    hint: 'Clicks from advertising reports',
    group: ADVERTISING_GROUP,
  },
  {
    key: 'ad_spend',
    label: 'Ad Spend ($)',
    required: false,
    expectedType: NUMBER_TYPE,
    hint: 'Total advertising spend from reports',
    group: ADVERTISING_GROUP,
  },
  {
    key: 'ad_sales',
    label: 'Ad Sales ($)',
    required: false,
    expectedType: NUMBER_TYPE,
    hint: 'Sales attributed to ads from reports',
    group: ADVERTISING_GROUP,
  },
  {
    key: 'ad_orders',
    label: 'Ad Orders',
    required: false,
    expectedType: NUMBER_TYPE,
    hint: 'Orders attributed to ads from reports',
    group: ADVERTISING_GROUP,
  },
  {
    key: 'profit',
    label: 'Profit ($)',
    required: false,
    expectedType: NUMBER_TYPE,
    hint: 'Manually calculated or from specific profit reports',
    group: GROUP_FINANCIALS,
  },
  {
    key: 'inventory_level',
    label: 'Inventory Level',
    required: false,
    expectedType: NUMBER_TYPE,
    group: OPERATIONS_GROUP,
  },
  {
    key: 'review_rating',
    label: 'Review Rating',
    required: false,
    expectedType: NUMBER_TYPE,
    group: PRODUCT_HEALTH_GROUP,
  },
  {
    key: 'cac',
    label: 'CAC ($)',
    required: false,
    expectedType: NUMBER_TYPE,
    hint: 'Customer Acquisition Cost',
    group: GROUP_FINANCIALS,
  },
  {
    key: 'ltv',
    label: 'LTV ($)',
    required: false,
    expectedType: NUMBER_TYPE,
    hint: 'Customer Lifetime Value',
    group: GROUP_FINANCIALS,
  },
];

export const SAMPLE_CARD_DATA = {
  total_conversion_rate: 5.21,
  total_sales_sample: 12345.67,
  avg_clicks: 152.3,
};

export const SAMPLE_CHART_DATA: DashboardMetrics[] = [
  {
    date: 'Jan',
    unique_identifier: 'ASIN_A',
    total_sales: 8500,
    total_orders: 85,
    total_sessions: 1900,
    total_conversion_rate: 4.5,
    ad_spend: 500,
    ad_sales: 2000,
    ad_clicks: 120,
    ad_impressions: 15000,
  },
  {
    date: 'Feb',
    unique_identifier: 'ASIN_A',
    total_sales: 9200,
    total_orders: 92,
    total_sessions: 1840,
    total_conversion_rate: 5.0,
    ad_spend: 550,
    ad_sales: 2200,
    ad_clicks: 135,
    ad_impressions: 16500,
  },
  {
    date: 'Mar',
    unique_identifier: 'ASIN_A',
    total_sales: 11500,
    total_orders: 115,
    total_sessions: 2090,
    total_conversion_rate: 5.5,
    ad_spend: 600,
    ad_sales: 3000,
    ad_clicks: 160,
    ad_impressions: 18000,
  },
  // Add more sample data points if needed
  {
    date: 'Apr',
    unique_identifier: 'ASIN_A',
    total_sales: 10800,
    total_orders: 108,
    total_sessions: 2038,
    total_conversion_rate: 5.3,
    ad_spend: 580,
    ad_sales: 2800,
    ad_clicks: 150,
    ad_impressions: 17500,
  },
];
