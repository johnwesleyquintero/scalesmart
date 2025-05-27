// src/lib/utils/amazon/data-transformation.ts
import type {
  DashboardMetrics,
  TargetMetricConfig,
} from '@/app/amazon-seller-tools/page'; // Adjust path if types are moved
import type { CsvColumnMapping } from '@/types/data-mapping';
import type { CsvTransformerFieldType } from '@/types/csv-transformer-config';

/**
 * Interface to represent a transformation error or warning for a specific CSV row and column.
 */
export interface TransformationError {
  rowNumber: number; // 0-indexed, or -1 for file-level error
  column: string; // The original CSV header or the target metric key
  message: string;
  type: 'error' | 'warning';
}

/**
 * Interface for the result of transforming a single CSV row, including data and any associated errors.
 */
export interface CsvRowTransformationResult {
  data: DashboardMetrics | null; // Null if row is critically invalid/skipped
  errors: TransformationError[];
}

/**
 * Attempts to extract a date string from a CSV row based on a mapped header or common date headers.
 * @param row The raw CSV row data.
 * @param mappedHeader The key from DashboardMetrics mapped to the date column.
 * @param rowNumber The 0-indexed row number from the original CSV.
 * @param targetMetricsConfig The configuration for target metrics, used for hints/validation.
 * @returns An object containing the extracted date string and any errors.
 */
export const getDateFromRow = (
  row: Record<string, string>,
  mappedHeader: keyof DashboardMetrics | null,
  rowNumber: number,
  targetMetricsConfig: TargetMetricConfig[],
): { value: string | undefined; errors: TransformationError[] } => {
  const errors: TransformationError[] = [];
  const potentialHeaders = [
    mappedHeader,
    'Date',
    'Settlement end date',
    'Day',
    'Week',
    'Month',
    'Report Date',
  ].filter(Boolean);

  let dateValue: string | undefined;

  for (const header of potentialHeaders) {
    if (header && row[header as string]) {
      dateValue = row[header as string];
      // Basic date format validation (YYYY-MM-DD for now)
      if (dateValue && !/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        errors.push({
          rowNumber,
          column: header as string,
          message: `Potential date format issue for '${header}': '${dateValue}' does not match YYYY-MM-DD.`,
          type: 'error', // Changed to error
        });
        dateValue = undefined; // Set to undefined if format is critically invalid
      }
      return { value: dateValue, errors };
    }
  }

  // If a date header was mapped but no value was found or it was invalid
  if (mappedHeader && mappedHeader !== 'Unknown') {
    errors.push({
      rowNumber,
      column: mappedHeader as string,
      message: `Required date value for '${mappedHeader}' not found or unreadable.`,
      type: 'error',
    });
  } else {
    // Generic error if no identifiable date column found
    errors.push({
      rowNumber,
      column: 'Date Column',
      message: 'No identifiable date column found for this row.',
      type: 'error', // Critical error if date is essential for a metric
    });
  }

  return { value: undefined, errors };
};


/**
 * Extracts a string value from a CSV row based on a mapped header.
 * @param row The raw CSV row data.
 * @param mappedHeader The key from DashboardMetrics mapped to the string column.
 * @param rowNumber The 0-indexed row number from the original CSV.
 * @param targetMetricsConfig The configuration for target metrics, used for hints/validation.
 * @returns An object containing the extracted string value and any errors.
 */
export const getStringValueFromRow = (
  row: Record<string, string>,
  mappedHeader: keyof DashboardMetrics | null | undefined,
  rowNumber: number,
  targetMetricsConfig: TargetMetricConfig[],
): { value: string | undefined; errors: TransformationError[] } => {
  const errors: TransformationError[] = [];
  let value: string | undefined;

  if (mappedHeader && row[mappedHeader as string] !== undefined) {
    value = row[mappedHeader as string]?.trim();
  }

  const metricConfig = targetMetricsConfig.find(config => config.key === mappedHeader);
  if (metricConfig?.required && (!value || value.length === 0)) {
    errors.push({
      rowNumber,
      column: mappedHeader as string,
      message: `Required string field '${metricConfig.label}' is empty.`,
      type: 'error',
    });
  }

  return { value, errors };
};


/**
 * Extracts and parses a numeric value from a CSV row based on a mapped header or fallback headers.
 * Handles currency symbols, commas, etc., and collects errors for non-numeric or missing required values.
 * @param row The raw CSV row data.
 * @param mappedHeader The key from DashboardMetrics mapped to the numeric column.
 * @param rowNumber The 0-indexed row number from the original CSV.
 * @param targetMetricsConfig The configuration for target metrics, used for hints/validation.
 * @param fallbackHeaders Optional list of fallback headers to check if the primary mapped header is not found or empty.
 * @returns An object containing the parsed number or undefined, and any errors.
 */
export const getNumericValueFromRow = (
  row: Record<string, string>,
  mappedHeader: keyof DashboardMetrics | null | undefined,
  rowNumber: number,
  targetMetricsConfig: TargetMetricConfig[],
  fallbackHeaders: string[] = [],
): { value: number | undefined; errors: TransformationError[] } => {
  const errors: TransformationError[] = [];
  const headersToCheck = [mappedHeader, ...fallbackHeaders].filter(Boolean);
  let numericValue: number | undefined;
  let foundValue = false;

  for (const header of headersToCheck) {
    if (!header) continue;
    const rawValue = row[header as string];
    if (rawValue !== undefined && rawValue !== null) {
      foundValue = true;
      const cleanedValue = String(rawValue).replace(/[^0-9.-]+/g, '');
      const num = parseFloat(cleanedValue);
      if (!isNaN(num)) {
        numericValue = num;
        break; // Found a valid number, stop checking fallbacks
      } else {
        errors.push({
          rowNumber,
          column: header as string,
          message: `Invalid numeric format for '${header}': '${rawValue}' could not be parsed as a number.`,
          type: 'warning', // Warning for non-critical numbers
        });
      }
    }
  }

  const metricConfig = targetMetricsConfig.find(config => config.key === mappedHeader);
  if (metricConfig?.required && (!foundValue || numericValue === undefined)) {
    errors.push({
      rowNumber,
      column: mappedHeader as string,
      message: `Required numeric field '${metricConfig.label}' is missing or critically invalid.`,
      type: 'error',
    });
  }

  return { value: numericValue, errors };
};


/**
 * Transforms a single raw CSV row into a DashboardMetrics object, collecting detailed errors.
 * @param row The raw CSV row data.
 * @param mapping The CsvColumnMapping object.
 * @param rowNumber The 0-indexed row number from the original CSV.
 * @param targetMetricsConfig The configuration for target metrics.
 * @returns A CsvRowTransformationResult object containing the DashboardMetrics (or null) and a list of errors/warnings.
 */
export const transformCsvRow = (
  row: Record<string, string>,
  mapping: CsvColumnMapping,
  rowNumber: number,
  targetMetricsConfig: TargetMetricConfig[],
): CsvRowTransformationResult => {
  const allErrors: TransformationError[] = [];
  let dashboardMetrics: DashboardMetrics | null = null;

  // Process Date
  const { value: date, errors: dateErrors } = getDateFromRow(
    row,
    mapping.date,
    rowNumber,
    targetMetricsConfig,
  );
  allErrors.push(...dateErrors);
  if (date === undefined) {
    return { data: null, errors: allErrors }; // Critical error, cannot process row without a date
  }

  // Process Unique Identifier
  const { value: unique_identifier, errors: idErrors } = getStringValueFromRow(
    row,
    mapping.unique_identifier,
    rowNumber,
    targetMetricsConfig,
  );
  allErrors.push(...idErrors);

  // Process other numeric metrics
  const total_sales_result = getNumericValueFromRow(row, mapping.total_sales, rowNumber, targetMetricsConfig, ['Ordered product sales', 'Gross Sales']);
  allErrors.push(...total_sales_result.errors);

  const total_orders_result = getNumericValueFromRow(row, mapping.total_orders, rowNumber, targetMetricsConfig, ['Total order items', 'Units Ordered']);
  allErrors.push(...total_orders_result.errors);

  const total_sessions_result = getNumericValueFromRow(row, mapping.total_sessions, rowNumber, targetMetricsConfig, ['Sessions', '(Parent ASIN) Sessions']);
  allErrors.push(...total_sessions_result.errors);

  const total_page_views_result = getNumericValueFromRow(row, mapping.total_page_views, rowNumber, targetMetricsConfig, ['Page Views', '(Parent ASIN) Page Views']);
  allErrors.push(...total_page_views_result.errors);

  const ad_impressions_result = getNumericValueFromRow(row, mapping.ad_impressions, rowNumber, targetMetricsConfig, ['Impressions']);
  allErrors.push(...ad_impressions_result.errors);

  const ad_clicks_result = getNumericValueFromRow(row, mapping.ad_clicks, rowNumber, targetMetricsConfig, ['Clicks']);
  allErrors.push(...ad_clicks_result.errors);

  const ad_spend_result = getNumericValueFromRow(row, mapping.ad_spend, rowNumber, targetMetricsConfig, ['Spend', 'Cost']);
  allErrors.push(...ad_spend_result.errors);

  const ad_sales_result = getNumericValueFromRow(row, mapping.ad_sales, rowNumber, targetMetricsConfig, ['Sales', '7 Day Total Sales ']);
  allErrors.push(...ad_sales_result.errors);

  const ad_orders_result = getNumericValueFromRow(row, mapping.ad_orders, rowNumber, targetMetricsConfig, ['Orders', '7 Day Total Orders ']);
  allErrors.push(...ad_orders_result.errors);

  const profit_result = getNumericValueFromRow(row, mapping.profit, rowNumber, targetMetricsConfig);
  allErrors.push(...profit_result.errors);

  const inventory_level_result = getNumericValueFromRow(row, mapping.inventory_level, rowNumber, targetMetricsConfig);
  allErrors.push(...inventory_level_result.errors);

  const review_rating_result = getNumericValueFromRow(row, mapping.review_rating, rowNumber, targetMetricsConfig);
  allErrors.push(...review_rating_result.errors);

  const cac_result = getNumericValueFromRow(row, mapping.cac, rowNumber, targetMetricsConfig);
  allErrors.push(...cac_result.errors);

  const ltv_result = getNumericValueFromRow(row, mapping.ltv, rowNumber, targetMetricsConfig);
  allErrors.push(...ltv_result.errors);

  const asin_result = getStringValueFromRow(row, mapping.asin, rowNumber, targetMetricsConfig);
  allErrors.push(...asin_result.errors);

  const keyword_result = getStringValueFromRow(row, mapping.keyword, rowNumber, targetMetricsConfig);
  allErrors.push(...keyword_result.errors);

  const targeted_keyword_result = getStringValueFromRow(row, mapping.targeted_keyword, rowNumber, targetMetricsConfig);
  allErrors.push(...targeted_keyword_result.errors);


  // Calculate derived metrics
  const rawTotalConversionRate =
    total_sessions_result.value && total_sessions_result.value > 0 && total_orders_result.value
      ? (total_orders_result.value / total_sessions_result.value) * 100
      : 0;
  const total_conversion_rate = parseFloat(rawTotalConversionRate.toFixed(2));

  const acos =
    ad_spend_result.value && ad_sales_result.value && ad_sales_result.value > 0
      ? (ad_spend_result.value / ad_sales_result.value) * 100
      : 0;
  const roas =
    ad_spend_result.value && ad_spend_result.value > 0 && ad_sales_result.value
      ? ad_sales_result.value / ad_spend_result.value
      : 0;
  const cpc =
    ad_spend_result.value && ad_clicks_result.value && ad_clicks_result.value > 0
      ? ad_spend_result.value / ad_clicks_result.value
      : 0;
  const ctr =
    ad_impressions_result.value && ad_impressions_result.value > 0 && ad_clicks_result.value
      ? (ad_clicks_result.value / ad_impressions_result.value) * 100
      : 0;
  const ad_conversion_rate =
    ad_clicks_result.value && ad_clicks_result.value > 0 && ad_orders_result.value
      ? (ad_orders_result.value / ad_clicks_result.value) * 100
      : 0;

  dashboardMetrics = {
    date,
    unique_identifier: unique_identifier || '',
    total_sales: total_sales_result.value,
    total_orders: total_orders_result.value,
    total_sessions: total_sessions_result.value,
    total_page_views: total_page_views_result.value,
    total_conversion_rate: isNaN(total_conversion_rate) ? 0 : total_conversion_rate,
    ad_impressions: ad_impressions_result.value,
    ad_clicks: ad_clicks_result.value,
    ad_spend: ad_spend_result.value,
    ad_sales: ad_sales_result.value,
    ad_orders: ad_orders_result.value,
    acos: parseFloat(acos.toFixed(2)),
    roas: parseFloat(roas.toFixed(2)),
    cpc: parseFloat(cpc.toFixed(2)),
    ctr: parseFloat(ctr.toFixed(2)),
    ad_conversion_rate: parseFloat(ad_conversion_rate.toFixed(2)),
    profit: profit_result.value,
    inventory_level: inventory_level_result.value,
    review_rating: review_rating_result.value,
    cac: cac_result.value,
    ltv: ltv_result.value,
    asin: asin_result.value || '',
    keyword: keyword_result.value || '',
    targeted_keyword: targeted_keyword_result.value || '',
  };

  return { data: dashboardMetrics, errors: allErrors };
};
