// src/lib/utils/amazon/data-transformation.ts
import type {
  DashboardMetrics,
  TargetMetricConfig,
  MetricKey,
} from '@/lib/amazon-tools/types';
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

// --- Validation Rules and Outlier Thresholds ---
// Define simple thresholds for flagging potential outliers.
// These are basic examples and could be made more sophisticated (e.g., statistical methods)
const OUTLIER_THRESHOLDS: {
  [key in keyof DashboardMetrics]?: { min?: number; max?: number };
} = {
  total_sales: { min: 0, max: 100000 }, // Example: Flag sales > 100k
  total_orders: { min: 0, max: 5000 }, // Example: Flag orders > 5k
  total_sessions: { min: 0, max: 50000 }, // Example: Flag sessions > 50k
  total_page_views: { min: 0, max: 100000 }, // Example: Flag page views > 100k
  total_conversion_rate: { min: 0, max: 50 }, // Example: Flag conversion rate > 50%
  ad_impressions: { min: 0, max: 1000000 }, // Example: Flag impressions > 1M
  ad_clicks: { min: 0, max: 50000 }, // Example: Flag clicks > 50k
  ad_spend: { min: 0, max: 10000 }, // Example: Flag ad spend > 10k
  ad_sales: { min: 0, max: 50000 }, // Example: Flag ad sales > 50k
  ad_orders: { min: 0, max: 2000 }, // Example: Flag ad orders > 2k
  acos: { min: 0, max: 100 }, // Example: Flag ACoS > 100% (can be valid, but often indicates an issue)
  roas: { min: 0, max: 50 }, // Example: Flag ROAS > 50 (can be valid, but often indicates high performance or data issue)
  cpc: { min: 0, max: 20 }, // Example: Flag CPC > 20
  ctr: { min: 0, max: 20 }, // Example: Flag CTR > 20%
  ad_conversion_rate: { min: 0, max: 50 }, // Example: Flag ad conversion rate > 50%
  profit: { min: -10000, max: 50000 }, // Example: Flag large losses or very high profits
  inventory_level: { min: 0, max: 100000 }, // Example: Flag inventory > 100k
  review_rating: { min: 1, max: 5 }, // Example: Flag ratings outside 1-5
  cac: { min: 0, max: 500 }, // Example: Flag high CAC
  ltv: { min: 0, max: 5000 }, // Example: Flag high LTV
  keyword_ad_impressions: { min: 0, max: 500000 },
  keyword_ad_clicks: { min: 0, max: 20000 },
  keyword_ad_spend: { min: 0, max: 5000 },
  keyword_ad_sales_7_day: { min: 0, max: 20000 },
  keyword_ad_orders_7_day: { min: 0, max: 1000 },
};

/**
 * Checks if a numeric value is potentially an outlier based on predefined thresholds.
 * @param key The metric key.
 * @param value The numeric value.
 * @returns True if the value is outside the defined thresholds, false otherwise.
 */
const isOutlier = (key: keyof DashboardMetrics, value: number): boolean => {
  const thresholds = OUTLIER_THRESHOLDS[key];
  if (!thresholds) return false;

  if (thresholds.min !== undefined && value < thresholds.min) return true;
  if (thresholds.max !== undefined && value > thresholds.max) return true;

  return false;
};

/**
 * Attempts to parse a date string and validate its format.
 * @param dateString The raw date string from the CSV.
 * @param header The original CSV header name.
 * @param rowNumber The 0-indexed row number.
 * @param errors Array to push errors/warnings into.
 * @returns The parsed date string in YYYY-MM-DD format or undefined if invalid.
 */
const parseAndValidateDate = (
  dateString: string,
  header: string,
  rowNumber: number,
  errors: TransformationError[],
): { value: string | undefined; validationWarning: boolean } => {
  let validationWarning = false;

  // Basic date format validation (YYYY-MM-DD for now)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    errors.push({
      rowNumber,
      column: header,
      message: `Potential date format issue for '${header}': '${dateString}' does not match YYYY-MM-DD.`,
      type: 'warning',
    });
    validationWarning = true;
    // Attempt to parse date even with format issue if it's a common format
    const parsedDate = new Date(dateString);
    if (!isNaN(parsedDate.getTime())) {
      dateString = parsedDate.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
    } else {
      errors.push({
        rowNumber,
        column: header,
        message: `Critical date format issue for '${header}': '${dateString}' could not be parsed as a valid date.`,
        type: 'error',
      });
      return { value: undefined, validationWarning: false }; // Critical error
    }
  }

  // Additional check for valid date after potential parsing
  const checkDate = new Date(dateString);
  if (isNaN(checkDate.getTime())) {
    errors.push({
      rowNumber,
      column: header,
      message: `Critical date format issue for '${header}': '${dateString}' could not be parsed as a valid date.`,
      type: 'error',
    });
    return { value: undefined, validationWarning: false }; // Critical error
  }

  return { value: dateString, validationWarning };
};

/**
 * Attempts to extract a date string from a CSV row based on a mapped header or common date headers.
 * Includes basic validation and flags.
 * @param row The raw CSV row data.
 * @param mappedHeader The key from DashboardMetrics mapped to the date column.
 * @param rowNumber The 0-indexed row number from the original CSV.
 * @param targetMetricsConfig The configuration for target metrics, used for hints/validation.
 * @returns An object containing the extracted date string, any errors, and validation flags.
 */
export const getDateFromRow = (
  row: Record<string, string>,
  mappedHeader: keyof DashboardMetrics | null,
  rowNumber: number,
  targetMetricsConfig: readonly TargetMetricConfig[],
): {
  value: string | undefined;
  errors: TransformationError[];
  validationWarning: boolean;
} => {
  const errors: TransformationError[] = [];
  let validationWarning = false;
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
      const rawDateString = row[header as string];
      const result = parseAndValidateDate(
        rawDateString,
        header as string,
        rowNumber,
        errors,
      );
      dateValue = result.value;
      validationWarning = result.validationWarning;
      if (dateValue !== undefined) {
        return { value: dateValue, errors, validationWarning };
      }
    }
  }

  // If a date header was mapped but no value was found or it was invalid
  if (
    mappedHeader &&
    typeof mappedHeader === 'string' &&
    mappedHeader !== 'Unknown'
  ) {
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

  return { value: undefined, errors, validationWarning: false };
};

/**
 * Extracts a string value from a CSV row based on a mapped header.
 * Includes basic validation and flags.
 * @param row The raw CSV row data.
 * @param mappedHeader The key from DashboardMetrics mapped to the string column.
 * @param rowNumber The 0-indexed row number from the original CSV.
 * @param targetMetricsConfig The configuration for target metrics, used for hints/validation.
 * @returns An object containing the extracted string value, any errors, and validation flags.
 */
export const getStringValueFromRow = (
  row: Record<string, string>,
  mappedHeader: keyof DashboardMetrics | null | undefined,
  rowNumber: number,
  targetMetricsConfig: readonly TargetMetricConfig[],
): {
  value: string | undefined;
  errors: TransformationError[];
  validationWarning: boolean;
} => {
  const errors: TransformationError[] = [];
  let validationWarning = false;
  let value: string | undefined;

  if (mappedHeader && row[mappedHeader as string] !== undefined) {
    value = row[mappedHeader as string]?.trim();
  }

  const metricConfig = targetMetricsConfig.find(
    (config) => config.key === mappedHeader,
  );
  if (metricConfig?.required && (!value || value.length === 0)) {
    errors.push({
      rowNumber,
      column: mappedHeader as string,
      message: `Required string field '${metricConfig.label}' is empty.`,
      type: 'error',
    });
  } else if (
    value &&
    mappedHeader === 'unique_identifier' &&
    !/^[A-Z0-9]{10}$/.test(value) &&
    !/^[A-Z0-9]+$/.test(value)
  ) {
    // Basic validation for ASIN/SKU format
    errors.push({
      rowNumber,
      column: mappedHeader as string,
      message: `Potential format issue for '${metricConfig?.label || mappedHeader}': '${value}' does not look like a standard ASIN or SKU.`,
      type: 'warning',
    });
    validationWarning = true;
  } else if (
    value &&
    (mappedHeader === 'asin' || mappedHeader === 'unique_identifier') &&
    !/^[A-Z0-9]{10}$/.test(value)
  ) {
    // More specific ASIN format validation
    errors.push({
      rowNumber,
      column: mappedHeader as string,
      message: `Potential ASIN format issue for '${metricConfig?.label || mappedHeader}': '${value}' does not look like a standard 10-character ASIN.`,
      type: 'warning',
    });
    validationWarning = true;
  }

  return { value, errors, validationWarning };
};

/**
 * Parses a raw string value into a number, handling common non-numeric characters.
 * @param rawValue The raw string value from the CSV.
 * @returns The parsed number or NaN if parsing fails.
 */
const parseNumericValue = (rawValue: string): number => {
  const cleanedValue = String(rawValue).replace(/[^0-9.-]+/g, '');
  return parseFloat(cleanedValue);
};

/**
 * Finds and parses the first valid numeric value from a list of potential headers in a CSV row.
 * Collects errors for invalid formats encountered during the search.
 * @param row The raw CSV row data.
 * @param headersToCheck List of headers to check in order.
 * @param rowNumber The 0-indexed row number.
 * @param errors Array to push errors/warnings into.
 * @returns An object containing the found numeric value (or undefined), whether a value was found, and the raw value used.
 */
const findAndParseNumericValue = (
  row: Record<string, string>,
  headersToCheck: (keyof DashboardMetrics | string)[],
  rowNumber: number,
  errors: TransformationError[],
): {
  value: number | undefined;
  found: boolean;
  rawValueUsed: string | undefined;
} => {
  let numericValue: number | undefined;
  let foundValue = false;
  let rawValueUsed: string | undefined;

  for (const header of headersToCheck) {
    if (!header) continue;
    const rawValue = row[header as string];
    if (rawValue !== undefined && rawValue !== null) {
      foundValue = true;
      rawValueUsed = rawValue;
      const num = parseNumericValue(rawValue);
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
  return { value: numericValue, found: foundValue, rawValueUsed };
};

/**
 * Extracts and parses a numeric value from a CSV row based on a mapped header or fallback headers.
 * Handles currency symbols, commas, etc., collects errors, and flags potential outliers.
 * @param row The raw CSV row data.
 * @param mappedHeader The key from DashboardMetrics mapped to the numeric column.
 * @param rowNumber The 0-indexed row number from the original CSV.
 * @param targetMetricsConfig The configuration for target metrics, used for hints/validation.
 * @param fallbackHeaders Optional list of fallback headers to check if the primary mapped header is not found or empty.
 * @returns An object containing the parsed number or undefined, any errors, and an outlier flag.
 */
export const getNumericValueFromRow = (
  row: Record<string, string>,
  mappedHeader: keyof DashboardMetrics | null | undefined,
  rowNumber: number,
  targetMetricsConfig: readonly TargetMetricConfig[],
  fallbackHeaders: string[] = [],
): {
  value: number | undefined;
  errors: TransformationError[];
  outlierFlag: boolean;
} => {
  const errors: TransformationError[] = [];
  let outlierFlag = false;
  const headersToCheck = [mappedHeader, ...fallbackHeaders].filter(Boolean) as (
    | keyof DashboardMetrics
    | string
  )[];

  const {
    value: numericValue,
    found: foundValue,
    rawValueUsed,
  } = findAndParseNumericValue(row, headersToCheck, rowNumber, errors);

  const metricConfig = targetMetricsConfig.find(
    (config) => config.key === mappedHeader,
  );
  if (metricConfig?.required && (!foundValue || numericValue === undefined)) {
    errors.push({
      rowNumber,
      column: mappedHeader as string,
      message: `Required numeric field '${metricConfig.label}' is missing or critically invalid.`,
      type: 'error',
    });
  } else if (
    numericValue !== undefined &&
    mappedHeader &&
    mappedHeader &&
    typeof mappedHeader === 'string' &&
    mappedHeader !== 'Unknown'
  ) {
    // Check for outliers only if a valid number was found and a mapped header exists
    if (isOutlier(mappedHeader, numericValue)) {
      errors.push({
        rowNumber,
        column: mappedHeader as string,
        message: `Potential outlier detected for '${metricConfig?.label || mappedHeader}': Value '${rawValueUsed}' (${numericValue}) is outside typical range.`,
        type: 'warning',
      });
      outlierFlag = true;
    }
  }

  return { value: numericValue, errors, outlierFlag };
};

/**
 * Transforms a single raw CSV row into a DashboardMetrics object, collecting detailed errors and flags.
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
  targetMetricsConfig: readonly TargetMetricConfig[],
): CsvRowTransformationResult => {
  const allErrors: TransformationError[] = [];
  let dashboardMetrics: DashboardMetrics | null = null;

  // Process Date
  const {
    value: date,
    errors: dateErrors,
    validationWarning: dateValidationWarning,
  } = getDateFromRow(row, mapping.date, rowNumber, targetMetricsConfig);
  allErrors.push(...dateErrors);
  if (date === undefined) {
    return { data: null, errors: allErrors }; // Critical error, cannot process row without a date
  }

  // Process Unique Identifier
  const {
    value: unique_identifier,
    errors: idErrors,
    validationWarning: uniqueIdentifierValidationWarning,
  } = getStringValueFromRow(
    row,
    mapping.unique_identifier,
    rowNumber,
    targetMetricsConfig,
  );
  allErrors.push(...idErrors);

  // Process other numeric metrics
  const total_sales_result = getNumericValueFromRow(
    row,
    mapping.total_sales,
    rowNumber,
    targetMetricsConfig,
    ['Ordered product sales', 'Gross Sales'],
  );
  allErrors.push(...total_sales_result.errors);

  const total_orders_result = getNumericValueFromRow(
    row,
    mapping.total_orders,
    rowNumber,
    targetMetricsConfig,
    ['Total order items', 'Units Ordered'],
  );
  allErrors.push(...total_orders_result.errors);

  const total_sessions_result = getNumericValueFromRow(
    row,
    mapping.total_sessions,
    rowNumber,
    targetMetricsConfig,
    ['Sessions', '(Parent ASIN) Sessions'],
  );
  allErrors.push(...total_sessions_result.errors);

  const total_page_views_result = getNumericValueFromRow(
    row,
    mapping.total_page_views,
    rowNumber,
    targetMetricsConfig,
    ['Page Views', '(Parent ASIN) Page Views'],
  );
  allErrors.push(...total_page_views_result.errors);

  const ad_impressions_result = getNumericValueFromRow(
    row,
    mapping.ad_impressions,
    rowNumber,
    targetMetricsConfig,
    ['Impressions'],
  );
  allErrors.push(...ad_impressions_result.errors);

  const ad_clicks_result = getNumericValueFromRow(
    row,
    mapping.ad_clicks,
    rowNumber,
    targetMetricsConfig,
    ['Clicks'],
  );
  allErrors.push(...ad_clicks_result.errors);

  const ad_spend_result = getNumericValueFromRow(
    row,
    mapping.ad_spend,
    rowNumber,
    targetMetricsConfig,
    ['Spend', 'Cost'],
  );
  allErrors.push(...ad_spend_result.errors);

  const ad_sales_result = getNumericValueFromRow(
    row,
    mapping.ad_sales,
    rowNumber,
    targetMetricsConfig,
    ['Sales', '7 Day Total Sales '],
  );
  allErrors.push(...ad_sales_result.errors);

  const ad_orders_result = getNumericValueFromRow(
    row,
    mapping.ad_orders,
    rowNumber,
    targetMetricsConfig,
    ['Orders', '7 Day Total Orders '],
  );
  allErrors.push(...ad_orders_result.errors);

  const profit_result = getNumericValueFromRow(
    row,
    mapping.profit,
    rowNumber,
    targetMetricsConfig,
  );
  allErrors.push(...profit_result.errors);

  const inventory_level_result = getNumericValueFromRow(
    row,
    mapping.inventory_level,
    rowNumber,
    targetMetricsConfig,
  );
  allErrors.push(...inventory_level_result.errors);

  const review_rating_result = getNumericValueFromRow(
    row,
    mapping.review_rating,
    rowNumber,
    targetMetricsConfig,
  );
  allErrors.push(...review_rating_result.errors);

  const cac_result = getNumericValueFromRow(
    row,
    mapping.cac,
    rowNumber,
    targetMetricsConfig,
  );
  allErrors.push(...cac_result.errors);

  const ltv_result = getNumericValueFromRow(
    row,
    mapping.ltv,
    rowNumber,
    targetMetricsConfig,
  );
  allErrors.push(...ltv_result.errors);

  const asin_result = getStringValueFromRow(
    row,
    mapping.asin,
    rowNumber,
    targetMetricsConfig,
  );
  allErrors.push(...asin_result.errors);

  const keyword_result = getStringValueFromRow(
    row,
    mapping.keyword,
    rowNumber,
    targetMetricsConfig,
  );
  allErrors.push(...keyword_result.errors);

  const targeted_keyword_result = getStringValueFromRow(
    row,
    mapping.targeted_keyword,
    rowNumber,
    targetMetricsConfig,
  );
  allErrors.push(...targeted_keyword_result.errors);

  // Process keyword-specific numeric metrics
  const keyword_ad_impressions_result = getNumericValueFromRow(
    row,
    mapping.keyword_ad_impressions,
    rowNumber,
    targetMetricsConfig,
  );
  allErrors.push(...keyword_ad_impressions_result.errors);

  const keyword_ad_clicks_result = getNumericValueFromRow(
    row,
    mapping.keyword_ad_clicks,
    rowNumber,
    targetMetricsConfig,
  );
  allErrors.push(...keyword_ad_clicks_result.errors);

  const keyword_ad_spend_result = getNumericValueFromRow(
    row,
    mapping.keyword_ad_spend,
    rowNumber,
    targetMetricsConfig,
  );
  allErrors.push(...keyword_ad_spend_result.errors);

  const keyword_ad_sales_7_day_result = getNumericValueFromRow(
    row,
    mapping.keyword_ad_sales_7_day,
    rowNumber,
    targetMetricsConfig,
  );
  allErrors.push(...keyword_ad_sales_7_day_result.errors);

  const keyword_ad_orders_7_day_result = getNumericValueFromRow(
    row,
    mapping.keyword_ad_orders_7_day,
    rowNumber,
    targetMetricsConfig,
  );
  allErrors.push(...keyword_ad_orders_7_day_result.errors);

  // Calculate derived metrics
  const rawTotalConversionRate =
    total_sessions_result.value &&
    total_sessions_result.value > 0 &&
    total_orders_result.value
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
    ad_spend_result.value &&
    ad_clicks_result.value &&
    ad_clicks_result.value > 0
      ? ad_spend_result.value / ad_clicks_result.value
      : 0;
  const ctr =
    ad_impressions_result.value &&
    ad_impressions_result.value > 0 &&
    ad_clicks_result.value
      ? (ad_clicks_result.value / ad_impressions_result.value) * 100
      : 0;
  const ad_conversion_rate =
    ad_clicks_result.value &&
    ad_clicks_result.value > 0 &&
    ad_orders_result.value
      ? (ad_orders_result.value / ad_clicks_result.value) * 100
      : 0;

  dashboardMetrics = {
    date,
    unique_identifier: unique_identifier || '',
    total_sales: total_sales_result.value,
    total_orders: total_orders_result.value,
    total_sessions: total_sessions_result.value,
    total_page_views: total_page_views_result.value,
    total_conversion_rate: isNaN(total_conversion_rate)
      ? 0
      : total_conversion_rate,
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

    // Set validation and outlier flags
    date_validation_warning: dateValidationWarning,
    unique_identifier_validation_warning: uniqueIdentifierValidationWarning,
    total_sales_outlier_flag: total_sales_result.outlierFlag,
    total_orders_outlier_flag: total_orders_result.outlierFlag,
    total_sessions_outlier_flag: total_sessions_result.outlierFlag,
    total_page_views_outlier_flag: total_page_views_result.outlierFlag,
    total_conversion_rate_outlier_flag: isOutlier(
      'total_conversion_rate',
      total_conversion_rate,
    ), // Check derived metric
    ad_impressions_outlier_flag: ad_impressions_result.outlierFlag,
    ad_clicks_outlier_flag: ad_clicks_result.outlierFlag,
    ad_spend_outlier_flag: ad_spend_result.outlierFlag,
    ad_sales_outlier_flag: ad_sales_result.outlierFlag,
    ad_orders_outlier_flag: ad_orders_result.outlierFlag,
    acos_outlier_flag: isOutlier('acos', acos), // Check derived metric
    roas_outlier_flag: isOutlier('roas', roas), // Check derived metric
    cpc_outlier_flag: isOutlier('cpc', cpc), // Check derived metric
    ctr_outlier_flag: isOutlier('ctr', ctr), // Check derived metric
    ad_conversion_rate_outlier_flag: isOutlier(
      'ad_conversion_rate',
      ad_conversion_rate,
    ), // Check derived metric
    profit_outlier_flag: profit_result.outlierFlag,
    inventory_level_outlier_flag: inventory_level_result.outlierFlag,
    review_rating_outlier_flag: review_rating_result.outlierFlag,
    cac_outlier_flag: cac_result.outlierFlag,
    ltv_outlier_flag: ltv_result.outlierFlag,
    asin_validation_warning: asin_result.validationWarning,
    keyword_validation_warning: keyword_result.validationWarning,
    targeted_keyword_validation_warning:
      targeted_keyword_result.validationWarning,
    keyword_ad_impressions_outlier_flag:
      keyword_ad_impressions_result.outlierFlag,
    keyword_ad_clicks_outlier_flag: keyword_ad_clicks_result.outlierFlag,
    keyword_ad_spend_outlier_flag: keyword_ad_spend_result.outlierFlag,
    keyword_ad_sales_7_day_outlier_flag:
      keyword_ad_sales_7_day_result.outlierFlag,
    keyword_ad_orders_7_day_outlier_flag:
      keyword_ad_orders_7_day_result.outlierFlag,
  };

  return { data: dashboardMetrics, errors: allErrors };
};
