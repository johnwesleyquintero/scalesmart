import { z } from 'zod';

// Validation schema for FBA form inputs
export const fbaFormSchema = z.object({
  product: z
    .string()
    .min(3, 'Product name must be at least 3 characters')
    .max(100, 'Product name must not exceed 100 characters')
    .regex(
      /^[\w\s-]+$/,
      'Product name can only contain letters, numbers, spaces, and hyphens',
    ),
  cost: z
    .number()
    .min(0.01, 'Cost must be greater than 0')
    .max(999999.99, 'Cost must not exceed $999,999.99'),
  price: z
    .number()
    .min(0.01, 'Price must be greater than 0')
    .max(999999.99, 'Price must not exceed $999,999.99'),
  fees: z
    .number()
    .min(0, 'Fees cannot be negative')
    .max(999999.99, 'Fees must not exceed $999,999.99'),
});

// Type inference from schema
export type FbaFormData = z.infer<typeof fbaFormSchema>;

// Error handling types
export type ValidationError = {
  field: keyof FbaFormData;
  message: string;
};

// Validation helper function
export const validateFbaForm = (data: FbaFormData): ValidationError[] => {
  try {
    fbaFormSchema.parse(data);
    return [];
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues.map((issue) => ({
        field: issue.path[0] as keyof FbaFormData,
        message: issue.message,
      }));
    }
    return [{ field: 'product', message: 'Validation failed' }];
  }
};
