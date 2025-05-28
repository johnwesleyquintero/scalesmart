/*
 * Configuration for Amazon Seller Tools.
 * Defines target metrics, their types, labels, and grouping for data processing and display.
 */
// src/config/amazon-tools-config.ts
import type { TargetMetricConfig } from '@/lib/amazon-tools/types';

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
