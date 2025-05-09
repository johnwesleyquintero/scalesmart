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
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => ReturnType<T>) => {
  let timeout: NodeJS.Timeout;

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
