import { TargetMetricConfig, DashboardMetrics } from '@/lib/amazon-tools/types';
import { MetricTypes } from '@/config/amazon-tools-config';

/**
 * Validates if all required columns are present in the first row of CSV data.
 * @template T - The type of the CSV data rows.
 * @param csvData - An array of objects representing CSV rows.
 * @param requiredColumns - An array of column keys that are required.
 * @returns An array of missing column keys.
 */
export const validateRequiredColumns = <T extends Record<string, unknown>>(
  csvData: T[],
  requiredColumns: (keyof T)[],
): (keyof T)[] => {
  if (csvData.length === 0) return [];
  // Filter out columns that are present in the first row
  return requiredColumns.filter((col) => !(col in csvData[0]));
};

/**
 * Validates if a given string is a valid Amazon Standard Identification Number (ASIN) format.
 * A valid ASIN is a 10-character alphanumeric string.
 * @param asin - The ASIN string to validate.
 * @returns True if the ASIN format is valid, false otherwise.
 */
export const validateAsinFormat = (asin: string): boolean => {
  return /^[A-Z0-9]{10}$/.test(asin.trim());
};

/**
 * Safely parses a string or number value into a number.
 * Returns `undefined` if the value is `undefined`, `null`, or an empty string.
 * Throws an error if the value is a string that cannot be parsed as a valid number.
 * @param value - The value to parse. Can be string, number, undefined, or null.
 * @param fieldName - The name of the field being parsed, used in error messages.
 * @returns The parsed number, or `undefined` if the input was empty/null/undefined.
 * @throws {Error} If the string value cannot be parsed as a number.
 */
export const safeParseNumber = (
  value: string | number | undefined | null,
  fieldName: string,
): number | undefined => {
  if (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '')
  ) {
    return undefined; // Return undefined for empty or null values
  }
  const num =
    typeof value === 'string' ? parseFloat(value.trim()) : Number(value);
  if (isNaN(num)) {
    throw new Error(
      `Invalid ${fieldName.replace(/_/g, ' ')} value: "${value}". Expected a numeric value.`,
    );
  }
  return num;
};

/**
 * Processes raw CSV data into a structured format based on a provided metric configuration.
 * It validates required columns and attempts to parse values according to their expected types.
 * Fields that are not required and are empty/invalid will be set to `undefined`.
 * Parsing errors for individual fields will be logged as warnings.
 * @param csvData - An array of raw CSV row objects (string values).
 * @param metricConfig - An array of TargetMetricConfig defining how each column should be processed.
 * @returns An array of processed data rows, where values are parsed to their expected types,
 *          conforming to a subset of DashboardMetrics.
 * @throws {Error} If any *required* columns are missing from the CSV header.
 */
export const processAmazonCsv = (
  csvData: Record<string, string>[], // Raw CSV data where all values are strings
  metricConfig: TargetMetricConfig[],
): Partial<DashboardMetrics>[] => {
  // Return type is Partial<DashboardMetrics> as not all fields might be present
  // Identify required columns from the metric configuration
  const requiredColumns = metricConfig
    .filter((config) => config.required)
    .map((config) => config.key);

  // Validate that all required columns exist in the header of the first row
  const missingColumns = validateRequiredColumns(csvData, requiredColumns);
  if (missingColumns.length > 0) {
    throw new Error(
      `Missing required columns in CSV: ${missingColumns.join(', ')}`,
    );
  }

  return csvData.map((row, rowIndex) => {
    const processedRow: Partial<DashboardMetrics> = {};
    for (const config of metricConfig) {
      const key = config.key as keyof DashboardMetrics; // Ensure key is type-safe for DashboardMetrics
      const rawValue = row[config.key]; // Access raw value using config.key

      // Handle empty/undefined values for non-required fields
      if (
        (rawValue === undefined ||
          rawValue === null ||
          rawValue.trim() === '') &&
        !config.required
      ) {
        processedRow[key] = undefined;
        continue;
      }

      try {
        switch (config.expectedType) {
          case MetricTypes.NUMBER:
            // Use safeParseNumber for numeric fields
            processedRow[key] = safeParseNumber(rawValue, config.label);
            break;
          case MetricTypes.DATE:
            // Dates are kept as strings for now; further parsing can happen downstream if needed
            processedRow[key] = rawValue;
            break;
          case MetricTypes.STRING:
          default:
            processedRow[key] = rawValue;
            break;
        }
      } catch (error) {
        // Log a warning for parsing errors on non-required fields, or if a required field
        // has an invalid format (after it's confirmed to be present).
        console.warn(
          `[CSV Parsing Warning] Row ${rowIndex + 1}, Field "${config.label}" (${config.key}): ` +
            `Error parsing value "${rawValue}". ${error instanceof Error ? error.message : String(error)}`,
        );
        // Set the value to undefined or null on parsing failure, depending on desired behavior
        processedRow[key] = undefined;
      }
    }
    return processedRow;
  });
};
