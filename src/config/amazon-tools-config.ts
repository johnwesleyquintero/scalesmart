/*
 * Configuration for Amazon Seller Tools.
 * Defines target metrics, their types, labels, and grouping for data processing and display.
 */
// src/config/amazon-tools-config.ts
import type { TargetMetricConfig } from '@/lib/amazon-tools/types';

// Constants for TargetMetricConfig
/**
 * Defines the expected data types for target metrics.
 * Using `as const` ensures literal types are inferred, providing stronger type checking.
 */
export const MetricTypes = {
  DATE: 'date',
  STRING: 'string',
  NUMBER: 'number',
} as const;

/**
 * Defines the logical groups for organizing target metrics.
 * This enum improves readability and prevents typos compared to raw strings.
 */
export enum MetricGroups {
  CORE = 'Core',
  OVERALL_PERFORMANCE = 'Overall Performance',
  ADVERTISING = 'Advertising',
  OPERATIONS = 'Operations',
  PRODUCT_HEALTH = 'Product Health',
  FINANCIALS = 'Financials', // Used across components for consistency
}

/**
 * Configuration array for Amazon Seller Tools target metrics.
 * Each object defines a metric's key, label, requirements, expected type, hint, and group.
 * The array is marked as `readonly` to ensure immutability after initialization.
 */
export const TARGET_METRICS_CONFIG = [
  {
    key: 'date',
    label: 'Date/Period',
    required: true,
    expectedType: MetricTypes.DATE,
    hint: 'e.g., YYYY-MM-DD or MM/DD/YYYY',
    group: MetricGroups.CORE,
  },
  {
    key: 'unique_identifier',
    label: 'ASIN / SKU (Unique ID)',
    required: false,
    expectedType: MetricTypes.STRING,
    hint: 'Product identifier like B00EXAMPLE. Essential for multi-report merging.',
    group: MetricGroups.CORE,
  },
  {
    key: 'total_sales',
    label: 'Total Sales ($)',
    required: false,
    expectedType: MetricTypes.NUMBER,
    hint: 'Overall sales for the ASIN (e.g., from Business Report "Ordered product sales")',
    group: MetricGroups.OVERALL_PERFORMANCE,
  },
  {
    key: 'total_orders',
    label: 'Total Orders/Units',
    required: false,
    expectedType: MetricTypes.NUMBER,
    hint: 'Overall orders/units for the ASIN (e.g., "Total order items")',
    group: MetricGroups.OVERALL_PERFORMANCE,
  },
  {
    key: 'total_sessions',
    label: 'Total Sessions',
    required: false,
    expectedType: MetricTypes.NUMBER,
    hint: 'Overall sessions for the ASIN (e.g., "(Parent ASIN) Sessions" from Business Report)',
    group: MetricGroups.OVERALL_PERFORMANCE,
  },
  {
    key: 'total_page_views',
    label: 'Total Page Views',
    required: false,
    expectedType: MetricTypes.NUMBER,
    hint: 'Overall page views for the ASIN (e.g., "(Parent ASIN) Page Views" from Business Report)',
    group: MetricGroups.OVERALL_PERFORMANCE,
  },
  {
    key: 'ad_impressions',
    label: 'Ad Impressions',
    required: false,
    expectedType: MetricTypes.NUMBER,
    hint: 'Impressions from advertising reports',
    group: MetricGroups.ADVERTISING,
  },
  {
    key: 'ad_clicks',
    label: 'Ad Clicks',
    required: false,
    expectedType: MetricTypes.NUMBER,
    hint: 'Clicks from advertising reports',
    group: MetricGroups.ADVERTISING,
  },
  {
    key: 'ad_spend',
    label: 'Ad Spend ($)',
    required: false,
    expectedType: MetricTypes.NUMBER,
    hint: 'Total advertising spend from reports',
    group: MetricGroups.ADVERTISING,
  },
  {
    key: 'ad_sales',
    label: 'Ad Sales ($)',
    required: false,
    expectedType: MetricTypes.NUMBER,
    hint: 'Sales attributed to ads from reports',
    group: MetricGroups.ADVERTISING,
  },
  {
    key: 'ad_orders',
    label: 'Ad Orders',
    required: false,
    expectedType: MetricTypes.NUMBER,
    hint: 'Orders attributed to ads from reports',
    group: MetricGroups.ADVERTISING,
  },
  {
    key: 'profit',
    label: 'Profit ($)',
    required: false,
    expectedType: MetricTypes.NUMBER,
    hint: 'Manually calculated or from specific profit reports',
    group: MetricGroups.FINANCIALS,
  },
  {
    key: 'inventory_level',
    label: 'Inventory Level',
    required: false,
    expectedType: MetricTypes.NUMBER,
    group: MetricGroups.OPERATIONS,
  },
  {
    key: 'review_rating',
    label: 'Review Rating',
    required: false,
    expectedType: MetricTypes.NUMBER,
    group: MetricGroups.PRODUCT_HEALTH,
  },
  {
    key: 'cac',
    label: 'CAC ($)',
    required: false,
    expectedType: MetricTypes.NUMBER,
    hint: 'Customer Acquisition Cost',
    group: MetricGroups.FINANCIALS,
  },
  {
    key: 'ltv',
    label: 'LTV ($)',
    required: false,
    expectedType: MetricTypes.NUMBER,
    hint: 'Customer Lifetime Value',
    group: MetricGroups.FINANCIALS,
  },
] as const;
