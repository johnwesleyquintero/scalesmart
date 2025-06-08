import { z } from 'zod';

/**
 * Defines the schema for a single row of FBA data from a CSV.
 * All fields are initially treated as strings, as they come directly from CSV parsing.
 */
const fbaRowSchema = z.object({
  product: z.string().min(1, 'Product name cannot be empty.'),
  cost: z.string().min(1, 'Cost cannot be empty.'),
  price: z.string().min(1, 'Price cannot be empty.'),
  fees: z.string().min(1, 'Fees cannot be empty.'),
});

/**
 * Defines the required headers for FBA CSV files.
 */
export const fbaHeaders = {
  required: ['product', 'cost', 'price', 'fees'],
};

/**
 * Validates a single row of FBA data from a CSV.
 * This function is used by the `useCsvParser` hook to ensure data integrity.
 * It performs basic validation on the presence of string values.
 * Numeric conversion and more detailed validation (e.g., positive numbers)
 * should happen after this initial validation, typically in the component
 * consuming the parsed data.
 *
 * @param row The raw row object parsed from the CSV.
 * @param rowIndex The 0-based index of the row in the CSV (for error reporting).
 * @returns The validated row data as `FbaCsvRow`.
 * @throws Error if any required field is missing or invalid.
 */
export const validateFbaRow = (
  row: Record<string, string>,
  rowIndex: number,
) => {
  try {
    // Ensure keys match the schema by mapping to lowercase and checking
    const normalizedRow: Record<string, string> = {};
    for (const key in row) {
      normalizedRow[key.toLowerCase()] = row[key];
    }

    const validated = fbaRowSchema.parse({
      product: normalizedRow.product,
      cost: normalizedRow.cost,
      price: normalizedRow.price,
      fees: normalizedRow.fees,
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
 * Type representing a validated row from the FBA CSV, with all values as strings.
 * This is the output type of `validateFbaRow`.
 */
export type FbaCsvRow = z.infer<typeof fbaRowSchema>;
