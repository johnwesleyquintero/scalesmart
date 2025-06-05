import { z } from 'zod';

// Constants for validation limits
const PRODUCT_NAME_MIN_LENGTH = 3;
const PRODUCT_NAME_MAX_LENGTH = 100;
const MIN_MONETARY_VALUE = 0.01;
const MAX_MONETARY_VALUE = 999999.99;
const MIN_FEES_VALUE = 0;

/**
 * Zod schema for validating FBA (Fulfillment by Amazon) form inputs.
 * This schema ensures that product-related financial data adheres to specific business rules.
 */
export const fbaFormSchema = z.object({
  /**
   * Product name validation:
   * - Must be a string.
   * - Minimum length: 3 characters.
   * - Maximum length: 100 characters.
   * - Allowed characters: letters, numbers, spaces, and hyphens.
   */
  product: z
    .string()
    .min(
      PRODUCT_NAME_MIN_LENGTH,
      `Product name must be at least ${PRODUCT_NAME_MIN_LENGTH} characters`,
    )
    .max(
      PRODUCT_NAME_MAX_LENGTH,
      `Product name must not exceed ${PRODUCT_NAME_MAX_LENGTH} characters`,
    )
    .regex(
      /^[\w\s-]+$/,
      'Product name can only contain letters, numbers, spaces, and hyphens',
    ),
  /**
   * Cost validation:
   * - Must be a number.
   * - Must be greater than 0.01.
   * - Must not exceed 999,999.99.
   */
  cost: z
    .number()
    .min(MIN_MONETARY_VALUE, `Cost must be greater than ${MIN_MONETARY_VALUE}`)
    .max(MAX_MONETARY_VALUE, `Cost must not exceed $${MAX_MONETARY_VALUE}`),
  /**
   * Price validation:
   * - Must be a number.
   * - Must be greater than 0.01.
   * - Must not exceed 999,999.99.
   */
  price: z
    .number()
    .min(MIN_MONETARY_VALUE, `Price must be greater than ${MIN_MONETARY_VALUE}`)
    .max(MAX_MONETARY_VALUE, `Price must not exceed $${MAX_MONETARY_VALUE}`),
  /**
   * Fees validation:
   * - Must be a number.
   * - Cannot be negative (minimum 0).
   * - Must not exceed 999,999.99.
   */
  fees: z
    .number()
    .min(MIN_FEES_VALUE, `Fees cannot be negative (minimum ${MIN_FEES_VALUE})`)
    .max(MAX_MONETARY_VALUE, `Fees must not exceed $${MAX_MONETARY_VALUE}`),
});

/**
 * Type inference from the fbaFormSchema.
 * This type represents the structure of validated FBA form data.
 */
export type FbaFormData = z.infer<typeof fbaFormSchema>;

/**
 * Defines the structure for a validation error, including the field and an error message.
 */
export type ValidationError = {
  field: keyof FbaFormData;
  message: string;
};

/**
 * Helper function to validate FBA form data against the fbaFormSchema.
 * @param data - The FBA form data to validate.
 * @returns An array of `ValidationError` objects if validation fails, or an empty array if successful.
 */
export const validateFbaForm = (data: FbaFormData): ValidationError[] => {
  try {
    fbaFormSchema.parse(data);
    return []; // No errors
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Map Zod validation issues to a custom ValidationError format
      return error.issues.map((issue) => ({
        field: issue.path[0] as keyof FbaFormData, // Assuming path[0] is always the field name
        message: issue.message,
      }));
    }
    // Handle unexpected errors that are not ZodErrors
    console.error('An unexpected validation error occurred:', error);
    return [
      { field: 'product', message: 'An unexpected validation error occurred.' },
    ];
  }
};
