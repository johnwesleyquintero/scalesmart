import { z } from 'zod';

// Constants for common validation limits
const MAX_MONETARY_VALUE = 1_000_000; // Max value for monetary inputs
const MIN_PERCENTAGE = 0;
const MAX_PERCENTAGE = 100;
const MIN_POSITIVE_NUMBER_EXCLUSIVE = 0.00000001; // Smallest positive number allowed

/**
 * Zod schema for validating monetary values.
 * Ensures the value is a number, non-negative, and within a reasonable upper limit.
 */
export const monetaryValueSchema = z
  .number()
  .min(0, 'Value must be non-negative')
  .max(
    MAX_MONETARY_VALUE,
    `Value exceeds maximum limit of ${MAX_MONETARY_VALUE}`,
  );

/**
 * Zod schema for validating percentage values.
 * Ensures the value is a number between 0 and 100, inclusive.
 */
export const percentageSchema = z
  .number()
  .min(
    MIN_PERCENTAGE,
    `Percentage must be between ${MIN_PERCENTAGE} and ${MAX_PERCENTAGE}`,
  )
  .max(
    MAX_PERCENTAGE,
    `Percentage must be between ${MIN_PERCENTAGE} and ${MAX_PERCENTAGE}`,
  );

/**
 * Zod schema for validating strictly positive numbers.
 * Ensures the value is a number greater than zero.
 */
export const positiveNumberSchema = z
  .number()
  .min(MIN_POSITIVE_NUMBER_EXCLUSIVE, 'Value must be positive');

/**
 * Zod schema for a generic number.
 */
export const numberSchema = z.number();

/**
 * Validates the basic structure of CSV content rows.
 * Checks if each row is a non-null/undefined object.
 * @param content - An array of unknown items, typically parsed from CSV.
 * @returns An object containing an array of valid rows (cast to `Record<string, unknown>`)
 *          and an array of error messages for invalid rows.
 */
export const validateCsvContent = (
  content: unknown[],
): { validRows: Record<string, unknown>[]; errors: string[] } => {
  const errors: string[] = [];
  const validRows = content.filter((row, index) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      errors.push(
        `Row ${index + 1}: Invalid row format. Expected an object, but received: ${JSON.stringify(row)}`,
      );
      return false;
    }
    return true;
  }) as Record<string, unknown>[];
  return { validRows, errors };
};

/**
 * Zod schema for validating an Amazon Standard Identification Number (ASIN).
 * Ensures the ASIN is a 10-character alphanumeric string.
 */
export const asinSchema = z
  .string()
  .regex(
    /^[A-Z0-9]{10}$/,
    'Invalid ASIN format. Must be 10 alphanumeric characters.',
  );

/**
 * Zod schema for validating a product name.
 * Ensures the product name is a string with a minimum length of 3 characters.
 */
export const productNameSchema = z
  .string()
  .min(3, 'Product name must be at least 3 characters');
