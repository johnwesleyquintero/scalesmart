// src/lib/utils/amazon/data-transformation.ts
import type {
  DashboardMetrics,
  TargetMetricConfig,
} from '@/app/amazon-seller-tools/page'; // Adjust path if types are moved
import type { CsvColumnMapping } from '@/types/data-mapping';

/**
 * Attempts to extract a date string from a CSV row based on a mapped header or common date headers.
 * @param row The raw CSV row data.
 * @param mappedHeader The key from DashboardMetrics mapped to the date column.
 * @returns The extracted date string or 'Unknown'.
 */
export const getDateFromRow = (
  row: Record<string, string>,
  mappedHeader: keyof DashboardMetrics | null,
): string => {
  const mappedHeaderString = mappedHeader as string | null;
  const potentialHeaders = [
    mappedHeaderString,
    'Date',
    'Settlement end date',
    'Day',
    'Week',
    'Month',
    'Report Date',
  ].filter(Boolean) as string[];
  for (const header of potentialHeaders) {
    if (row[header]) {
      return row[header];
    }
  }
  return 'Unknown';
};

/**
 * Extracts a string value from a CSV row based on a mapped header.
 * @param row The raw CSV row data.
 * @param mappedHeader The key from DashboardMetrics mapped to the string column.
 * @returns The extracted string value or undefined.
 */
export const getStringValueFromRow = (
  row: Record<string, string>,
  mappedHeader: keyof DashboardMetrics | null,
): string | undefined => {
  const mappedHeaderString = mappedHeader as string | null;
  return mappedHeaderString && row[mappedHeaderString]
    ? String(row[mappedHeaderString]).trim()
    : undefined;
};

/**
 * Extracts and parses a numeric value from a CSV row based on a mapped header or fallback headers.
 * Handles currency symbols, commas, etc.
 * @param row The raw CSV row data.
 * @param mappedHeader The key from DashboardMetrics mapped to the numeric column.
 * @param fallbackHeaders Optional list of fallback headers to check if the primary mapped header is not found or empty.
 * @returns The parsed number or 0 if parsing fails or value is not found.
 */
export const getNumericValueFromRow = (
  row: Record<string, string>,
  mappedHeader: keyof DashboardMetrics | null,
  fallbackHeaders: string[] = [],
): number => {
  const mappedHeaderString = mappedHeader as string | null;
  const headersToCheck = [mappedHeaderString, ...fallbackHeaders].filter(
    Boolean,
  ) as string[];
  for (const header of headersToCheck) {
    const rawValue = row[header];
    if (rawValue !== undefined && rawValue !== null) {
      const cleanedValue = String(rawValue).replace(/[^0-9.-]+/g, '');
      const num = parseFloat(cleanedValue);
      if (!isNaN(num)) return num;
    }
  }
  return 0;
};

/**
 * Transforms a single raw CSV row into a DashboardMetrics object based on the provided mapping.
 * @param row The raw CSV row data.
 * @param mapping The CsvColumnMapping object.
 * @returns A DashboardMetrics object or null if the date cannot be extracted.
 */
export const transformCsvRow = (
  row: Record<string, string>,
  mapping: CsvColumnMapping,
): DashboardMetrics | null => {
  const dateHeader = mapping.date;
  const date = getDateFromRow(row, dateHeader);
  if (date === 'Unknown') return null; // Skip row if date is not found

  // Use the helper functions to extract and transform data for each metric
  const unique_identifier = getStringValueFromRow(
    row,
    mapping.unique_identifier,
  );
  const total_sales = getNumericValueFromRow(row, mapping.total_sales, [
    'Ordered product sales',
    'Gross Sales',
  ]);
  const total_orders = getNumericValueFromRow(row, mapping.total_orders, [
    'Total order items',
    'Units Ordered',
  ]);
  const total_sessions = getNumericValueFromRow(row, mapping.total_sessions, [
    'Sessions',
    '(Parent ASIN) Sessions',
  ]);
  const total_page_views = getNumericValueFromRow(
    row,
    mapping.total_page_views,
    ['Page Views', '(Parent ASIN) Page Views'],
  );
  const ad_impressions = getNumericValueFromRow(row, mapping.ad_impressions, [
    'Impressions',
  ]);
  const ad_clicks = getNumericValueFromRow(row, mapping.ad_clicks, ['Clicks']);
  const ad_spend = getNumericValueFromRow(row, mapping.ad_spend, [
    'Spend',
    'Cost',
  ]);
  const ad_sales = getNumericValueFromRow(row, mapping.ad_sales, [
    'Sales',
    '7 Day Total Sales ',
  ]);
  const ad_orders = getNumericValueFromRow(row, mapping.ad_orders, [
    'Orders',
    '7 Day Total Orders ',
  ]);
  const profit = getNumericValueFromRow(row, mapping.profit);
  const inventory_level = getNumericValueFromRow(row, mapping.inventory_level);
  const review_rating = getNumericValueFromRow(row, mapping.review_rating);
  const cac = getNumericValueFromRow(row, mapping.cac);
  const ltv = getNumericValueFromRow(row, mapping.ltv);

  // Calculate derived metrics (ACoS, RoAS, etc.) after extracting base values
  const rawTotalConversionRate =
    total_sessions && total_sessions > 0 && total_orders
      ? (total_orders / total_sessions) * 100
      : 0;
  const total_conversion_rate = parseFloat(rawTotalConversionRate.toFixed(2));
  const acos =
    ad_spend && ad_sales && ad_sales > 0 ? (ad_spend / ad_sales) * 100 : 0;
  const roas = ad_spend && ad_spend > 0 && ad_sales ? ad_sales / ad_spend : 0;
  const cpc = ad_spend && ad_clicks && ad_clicks > 0 ? ad_spend / ad_clicks : 0;
  const ctr =
    ad_impressions && ad_impressions > 0 && ad_clicks
      ? (ad_clicks / ad_impressions) * 100
      : 0;
  const ad_conversion_rate =
    ad_clicks && ad_clicks > 0 && ad_orders ? (ad_orders / ad_clicks) * 100 : 0;

  return {
    date,
    unique_identifier,
    total_sales,
    total_orders,
    total_sessions,
    total_page_views,
    total_conversion_rate: isNaN(total_conversion_rate)
      ? 0
      : total_conversion_rate, // Ensure conversion rate is a number
    ad_impressions,
    ad_clicks,
    ad_spend,
    ad_sales,
    ad_orders,
    acos: parseFloat(acos.toFixed(2)),
    roas: parseFloat(roas.toFixed(2)),
    cpc: parseFloat(cpc.toFixed(2)),
    ctr: parseFloat(ctr.toFixed(2)),
    ad_conversion_rate: parseFloat(ad_conversion_rate.toFixed(2)),
    profit,
    inventory_level,
    review_rating,
    cac,
    ltv,
    // Add other metrics as needed
  };
};
