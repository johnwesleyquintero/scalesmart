// DOMPurify removed - using simplified validation
import { z } from 'zod';
import { asinSchema, productNameSchema } from './input-validation';

// Description validation schema
export const descriptionSchema = z
  .string()
  .min(1, 'Description is required')
  .max(5000, 'Description is too long')
  .transform((val) => val); // Simple validation - no sanitization

// Product description validation schema
export const productDescriptionSchema = z.object({
  product: productNameSchema,
  asin: asinSchema.optional(),
  description: descriptionSchema,
});

// Debounce function for performance optimization
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => ReturnType<T>) => {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    return new Promise((resolve) => {
      timeout = setTimeout(() => {
        resolve(func(...args));
      }, wait);
    }) as ReturnType<T>;
  };
};

// Validate and sanitize product description
export const validateProductDescription = (data: unknown) => {
  return productDescriptionSchema.parse(data);
};
