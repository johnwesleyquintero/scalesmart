import { ProductCategory } from '@/lib/amazon-types';
import {
  monetaryValueSchema,
  percentageSchema,
  positiveNumberSchema,
  asinSchema, // Import asinSchema
  productNameSchema, // Import productNameSchema
} from '@/lib/input-validation';
import { safeParseNumber } from '@/lib/amazon-tools/csv-utils'; // Import safeParseNumber
import { z } from 'zod';

/**
 * Zod schema for validating inputs to the optimal price calculator.
 * This schema defines the expected structure and validation rules for various
 * parameters used in determining an optimal product price.
 */
export const optimalPriceInputSchema = z.object({
  /**
   * The cost of the product. Must be a valid monetary value.
   */
  cost: monetaryValueSchema,
  /**
   * The current selling price of the product. Must be a valid monetary value.
   */
  currentPrice: monetaryValueSchema,
  /**
   * A comma-separated string of competitor prices.
   * Transformed into an array of numbers. Each price must be valid and non-negative.
   */
  competitorPrices: z
    .string()
    .transform((val) =>
      val.split(',').map((p) => safeParseNumber(p.trim(), 'competitor price')),
    ) // Use safeParseNumber for robust parsing
    .refine(
      (prices) =>
        prices.length > 0 &&
        prices.every((p) => typeof p === 'number' && p >= 0), // Ensure all are valid non-negative numbers
      {
        message:
          'Please enter at least one valid competitor price (comma-separated numbers). Each price must be a non-negative number.',
      },
    ),
  /**
   * The average review rating of the product.
   * Optional, defaults to 0. Must be between 0 and 5.
   */
  reviewRating: z
    .number()
    .min(0, 'Review rating must be between 0 and 5')
    .max(5, 'Review rating must be between 0 and 5')
    .optional()
    .default(0),
  /**
   * The total count of reviews for the product.
   * Optional, defaults to 0. Must be a non-negative integer.
   */
  reviewCount: z.number().int().min(0).optional().default(0),
  /**
   * The product's price competitiveness as a percentage.
   * Optional, defaults to 0. Must be between 0 and 100.
   */
  priceCompetitiveness: percentageSchema.optional().default(0),
  /**
   * The health of the product's inventory as a percentage.
   * Optional, defaults to 0. Must be between 0 and 100.
   */
  inventoryHealth: percentageSchema.optional().default(0),
  /**
   * The weight of the product. Optional, defaults to 0. Must be a positive number.
   */
  weight: positiveNumberSchema.optional().default(0),
  /**
   * The volume of the product. Optional, defaults to 0. Must be a positive number.
   */
  volume: positiveNumberSchema.optional().default(0),
  /**
   * The number of reviews. Can be null or undefined.
   * If provided, must be a non-negative integer.
   */
  reviews: z.number().int().min(0).nullable().optional(),
  /**
   * The sales rank of the product. Optional, defaults to 0. Must be a positive number.
   */
  salesRank: positiveNumberSchema.optional().default(0),
  /**
   * The product's price. Optional, defaults to 0. Must be a valid monetary value.
   * Note: This might be redundant with `currentPrice` depending on usage.
   */
  price: monetaryValueSchema.optional().default(0),
  /**
   * The category of the product, using a native enum.
   */
  category: z.nativeEnum(ProductCategory),
});

/**
 * Infers the TypeScript type from the `optimalPriceInputSchema`.
 * This type represents the structure of validated optimal price calculator inputs.
 */
export type OptimalPriceInputs = z.infer<typeof optimalPriceInputSchema>;

/**
 * Helper function to validate optimal price inputs against the `optimalPriceInputSchema`.
 * Provides a structured response indicating success or failure, along with data or error messages.
 * @param data - The raw input data to validate.
 * @returns An object with `success` status, `data` (if successful), and `error` message (if failed).
 */
export const validateOptimalPriceInputs = (data: unknown) => {
  try {
    return {
      success: true,
      data: optimalPriceInputSchema.parse(data),
      error: null,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return the first validation error message for simplicity
      return {
        success: false,
        data: null,
        error: error.errors[0].message,
      };
    }
    // Handle any other unexpected errors during validation
    console.error(
      'An unexpected error occurred during optimal price input validation:',
      error,
    );
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred during input validation.',
    };
  }
};
