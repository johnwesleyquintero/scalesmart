import { z } from 'zod';

/**
 * Defines the schema for a single row of Keyword Analyzer data from a CSV.
 * All fields are initially treated as strings, as they come directly from CSV parsing.
 */
const keywordAnalyzerRowSchema = z.object({
  product: z.string().min(1, 'Product name cannot be empty.'),
  keywords: z.string().min(1, 'Keywords cannot be empty.'),
  searchvolume: z.string().optional(), // Optional, will be parsed later
  competition: z.string().optional(), // Optional, will be parsed later
});

/**
 * Defines the required headers for Keyword Analyzer CSV files.
 */
export const keywordAnalyzerHeaders = {
  required: ['product', 'keywords'],
};

/**
 * Validates a single row of Keyword Analyzer data from a CSV.
 * This function is used by the `useCsvParser` hook to ensure data integrity.
 * It performs basic validation on the presence of string values for required fields.
 * More detailed validation (e.g., numeric conversion for searchVolume)
 * should happen after this initial validation, typically in the component
 * consuming the parsed data.
 *
 * @param row The raw row object parsed from the CSV.
 * @param rowIndex The 0-based index of the row in the CSV (for error reporting).
 * @returns The validated row data as `KeywordAnalyzerCsvRow`.
 * @throws Error if any required field is missing or invalid.
 */
export const validateKeywordAnalyzerRow = (
  row: Record<string, string>,
  rowIndex: number,
) => {
  try {
    // Ensure keys match the schema by mapping to lowercase and checking
    const normalizedRow: Record<string, string> = {};
    for (const key in row) {
      normalizedRow[key.toLowerCase()] = row[key];
    }

    const validated = keywordAnalyzerRowSchema.parse({
      product: normalizedRow.product,
      keywords: normalizedRow.keywords,
      searchvolume: normalizedRow.searchvolume,
      competition: normalizedRow.competition,
    });

    return validated;
  } catch (error) {
    const errorMessage =
      error instanceof z.ZodError
        ? error.errors.map((err) => `${err.path[0]}: ${err.message}`).join(', ')
        : 'Unknown validation error';
    throw new Error(`Row ${rowIndex + 2} validation failed: ${errorMessage}`);
  }
};

/**
 * Type representing a validated row from the Keyword Analyzer CSV, with all values as strings.
 * This is the output type of `validateKeywordAnalyzerRow`.
 */
export type KeywordAnalyzerCsvRow = z.infer<typeof keywordAnalyzerRowSchema>;
