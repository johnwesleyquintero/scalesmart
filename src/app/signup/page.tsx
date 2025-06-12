'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { signUp } from '../auth/actions'; // Assuming signUp is the action
import Logo from '@/components/Logo';
import { PasswordStrengthIndicator } from '../login/login-helper-components'; // Re-use password strength indicator
import { ServerActionResult } from '../login/login-types'; // Import ServerActionResult

// Define schema for signup form
const signupFormSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters long.'),
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

// Type guard for error result
function isErrorResult(
  result: ServerActionResult,
): result is { success: false; error: string; mfaRequired?: boolean } {
  // Check if result is an object, not null, has 'success' property which is false, and has 'error' property which is a string
  return (
    typeof result === 'object' &&
    result !== null &&
    'success' in result &&
    result.success === false &&
    'error' in result &&
    typeof result.error === 'string'
  );
}

// Type guard for success result
function isSuccessResult(
  result: ServerActionResult,
): result is { success: true } {
  // Check if result is an object, not null, has 'success' property which is true
  return (
    typeof result === 'object' &&
    result !== null &&
    'success' in result &&
    result.success === true
  );
}

export default function SignupPage() {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange',
  });

  const handleSubmit = form.handleSubmit(async (values, event) => {
    startTransition(async () => {
      // Create FormData from the form values
      const formData = new FormData();
      formData.append('email', values.email);
      formData.append('password', values.password);

      const result: ServerActionResult = await signUp(formData);

      // Use type guards to check the result
      if (isErrorResult(result)) {
        const { error } = result; // Destructure to help type inference
        toast({
          title: 'Registration Failed',
          description: error,
          variant: 'destructive',
        });
      } else if (isSuccessResult(result)) {
        toast({
          title: 'Registration Successful',
          description: 'Please check your email to confirm your account.',
          variant: 'success',
        });
        form.reset();
      } else {
        // Handle unexpected result structure or void result
        console.error('Unexpected signup result structure:', result);
        toast({
          title: 'Registration Failed',
          description: 'An unexpected error occurred.',
          variant: 'destructive',
        });
      }
    });
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
      <Card className="w-full max-w-md rounded-lg shadow-lg overflow-hidden">
        <CardHeader className="text-center py-8 px-6">
          <div className="mb-4 flex flex-col items-center space-y-3">
            <Logo className="h-16 w-16 text-primary mb-2" />
            <CardTitle className="text-3xl font-bold tracking-tight">
              Create Your Account
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground px-4 leading-relaxed">
              Enter your email and choose a password to get started.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-0 sm:pt-2">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 text-foreground"
            noValidate
          >
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email-signup">Email</Label>
              <Input
                id="email-signup"
                type="email"
                placeholder="m@example.com"
                {...form.register('email')}
                disabled={isPending}
                autoComplete="email"
                required
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password-signup">Password</Label>
              <div className="relative">
                <Input
                  id="password-signup"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...form.register('password')}
                  disabled={isPending}
                  autoComplete="new-password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-1 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isPending}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-eye"
                    >
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-eye-off"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a1.8 1.8 0 0 1 0-2.6l.7-1.11M14.12 14.12a3 3 0 1 0-4.24-4.24M19.73 4.93A10 10 0 0 0 12 2C5 2 2 9 2 9M2 2l20 20" />
                    </svg>
                  )}
                  <span className="sr-only">
                    {showPassword ? 'Hide password' : 'Show password'}
                  </span>
                </Button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
              {form.watch('password') && (
                <PasswordStrengthIndicator password={form.watch('password')} />
              )}
            </div>

            {/* Sign Up Button */}
            <Button type="submit" className="w-full mt-4" disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Sign Up'
              )}
            </Button>

            {/* Back to Login Link */}
            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{' '}
              <Link
                href="/login"
                className="underline underline-offset-4 hover:text-primary"
              >
                Login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
