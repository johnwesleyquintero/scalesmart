import { z } from 'zod';

/**
 * Defines the schema for a single row of Keyword Trend data from a CSV.
 * All fields are initially treated as strings, as they come directly from CSV parsing.
 */
const keywordTrendRowSchema = z.object({
  keyword: z.string().min(1, 'Keyword cannot be empty.'),
  date: z.string().min(1, 'Date cannot be empty.'), // Will validate date format later
  search_volume: z.string().min(1, 'Search volume cannot be empty.'), // Will validate numeric value later
});

/**
 * Defines the required headers for Keyword Trend CSV files.
 */
export const keywordTrendHeaders = {
  required: ['keyword', 'date', 'search_volume'],
};

/**
 * Validates a single row of Keyword Trend data from a CSV.
 * This function is used by the `useCsvParser` hook to ensure data integrity.
 * It performs basic validation on the presence of string values for required fields.
 * More detailed validation (e.g., date format, numeric conversion for search_volume)
 * should happen after this initial validation, typically in the component
 * consuming the parsed data or within the `KeywordTrendService`.
 *
 * @param row The raw row object parsed from the CSV.
 * @param rowIndex The 0-based index of the row in the CSV (for error reporting).
 * @returns The validated row data as `KeywordTrendCsvRow`.
 * @throws Error if any required field is missing or invalid.
 */
export const validateKeywordTrendRow = (
  row: Record<string, string>,
  rowIndex: number,
) => {
  try {
    // Ensure keys match the schema by mapping to lowercase and checking
    const normalizedRow: Record<string, string> = {};
    for (const key in row) {
      normalizedRow[key.toLowerCase()] = row[key];
    }

    const validated = keywordTrendRowSchema.parse({
      keyword: normalizedRow.keyword,
      date: normalizedRow.date,
      search_volume: normalizedRow.search_volume,
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
 * Type representing a validated row from the Keyword Trend CSV, with all values as strings.
 * This is the output type of `validateKeywordTrendRow`.
 */
export type KeywordTrendCsvRow = z.infer<typeof keywordTrendRowSchema>;
