import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';
import { asinSchema, productNameSchema } from './input-validation';

// Description validation schema
export const descriptionSchema = z
  .string()
  .min(1, 'Description is required')
  .max(5000, 'Description is too long')
  .transform((val) =>
    DOMPurify.sanitize(val, {
      ALLOWED_TAGS: ['p', 'b', 'i', 'ul', 'ol', 'li', 'br'],
      ALLOWED_ATTR: [],
    }),
  );

// Product description validation schema
export const productDescriptionSchema = z.object({
  product: productNameSchema,
  asin: asinSchema.optional(),
  description: descriptionSchema,
});

// Debounce function for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => ReturnType<T> & { cancel: () => void } {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const debounced = (...args: Parameters<T>): ReturnType<T> | undefined => {
    clearTimeout(timeout);
    let result: ReturnType<T> | undefined;
    timeout = setTimeout(() => {
      result = func(...args) as ReturnType<T> | undefined; // Cast the result
    }, wait);
    // Note: This simple implementation doesn't return the result of the *last* invocation
    // immediately. A more complex implementation would store and return the last result.
    // For a void function like the one used in description-editor, this is fine.
    return result; // Will be undefined for void functions
  };

  debounced.cancel = () => {
    clearTimeout(timeout);
  };

  return debounced as (
    ...args: Parameters<T>
  ) => ReturnType<T> & { cancel: () => void };
}

// Validate and sanitize product description
export const validateProductDescription = (data: unknown) => {
  return productDescriptionSchema.parse(data);
};
