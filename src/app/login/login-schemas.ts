import * as z from 'zod';

// Zod schema for email/password login form
export const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .max(50, 'Password must not exceed 50 characters.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character',
    ),
  rememberMe: z.boolean().default(false).optional(), // Added for "Remember Me" functionality
});

// Zod schema for the MFA form
export const mfaFormSchema = z.object({
  mfaCode: z.string().min(6, 'MFA code must be at least 6 digits.'), // Assuming 6 digits based on common MFA
});

// Zod schema for the Forgot Password form
export const forgotPasswordFormSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});
