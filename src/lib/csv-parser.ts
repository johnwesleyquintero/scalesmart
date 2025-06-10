import Papa from 'papaparse';
import { z } from 'zod';
import { logError } from './error-handling';

/**
 * Options for the CSV parser.
 * @template T The expected type of the parsed row data.
 */
interface CsvParserOptions<T> {
  /** An array of header names that must be present in the CSV. */
  requiredHeaders: string[];
  /** A function to validate and transform each row of the parsed CSV data. */
  validateRow: (row: Record<string, unknown>) => T;
  /** Optional callback for handling errors during parsing. */
  onError?: (error: Error) => void;
  /** Optional callback for when parsing is complete. */
  onComplete?: (result: {
    data: T[];
    skippedRows: Array<{ index: number; reason: string }>;
  }) => void;
}

/**
 * Parses a CSV file using PapaParse, with options for header validation, row validation, and error handling.
 * Implements a streaming approach for efficient handling of large files.
 * @template T The expected type of the parsed row data.
 * @param file The File object to parse.
 * @param options Configuration options for parsing, including required headers and row validation.
 * @returns A promise that resolves to an object containing the parsed data and any skipped rows.
 */
export const parseCsvFile = async <T>(
  file: File,
  options: CsvParserOptions<T>,
): Promise<{
  data: T[];
  skippedRows: Array<{ index: number; reason: string }>;
}> => {
  return new Promise((resolve, reject) => {
    const skippedRows: Array<{ index: number; reason: string }> = [];
    const validData: T[] = [];

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      step: (results, parser) => {
        const row = results.data as Record<string, unknown>;
        const rowIndex = results.meta.cursor; // PapaParse provides cursor for row index

        // Validate headers on the first step (or if headers are not yet validated)
        if (
          results.meta.fields &&
          validData.length === 0 &&
          skippedRows.length === 0
        ) {
          const headers = results.meta.fields || [];
          const missingHeaders = options.requiredHeaders.filter(
            (header) => !headers.includes(header),
          );

          if (missingHeaders.length > 0) {
            const error = new Error(
              `Missing required headers: ${missingHeaders.join(', ')}`,
            );
            options.onError?.(error);
            parser.abort(); // Stop parsing on header error
            reject(error);
            return;
          }
        }

        try {
          // Skip header row if header option is true and it's the first row
          const validatedRow = options.validateRow(row);
          validData.push(validatedRow);
        } catch (error) {
          skippedRows.push({
            index: rowIndex,
            reason: error instanceof Error ? error.message : String(error),
          });
        }
      },
      complete: () => {
        // This complete is called after all steps are done
        const result = { data: validData, skippedRows };
        options.onComplete?.(result);
        resolve(result);
      },
      error: (error) => {
        logError({
          message: 'CSV parsing error',
          component: 'CsvParser',
          severity: 'medium',
          error: new Error(error.message),
          context: { fileName: file.name },
        });
        options.onError?.(new Error(error.message));
        reject(error);
      },
    });
  });
};

// Common CSV validation schemas
/**
 * Zod schema for transforming a string to a number, handling invalid number formats.
 */
export const csvNumberSchema = z.string().transform((val, ctx) => {
  const parsed = Number(val);
  if (isNaN(parsed)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid number format',
    });
    return z.NEVER;
  }
  return parsed;
});

/**
 * Zod schema for validating a string as a date format.
 */
export const csvDateSchema = z
  .string()
  .refine((val) => !isNaN(Date.parse(val)), 'Invalid date format');

/**
 * Zod schema for transforming a string to a boolean, handling various boolean representations.
 */
export const csvBooleanSchema = z.string().transform((val, ctx) => {
  const normalized = val.toLowerCase().trim();
  if (['true', '1', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'no'].includes(normalized)) return false;
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: 'Invalid boolean format',
  });
  return z.NEVER;
});
