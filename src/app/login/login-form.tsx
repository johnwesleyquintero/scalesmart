'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Github, Loader2 } from 'lucide-react';
import { signIn as NextAuthSignIn } from 'next-auth/react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .max(50, 'Password must not exceed 50 characters.'),
});

interface LoginFormProps {
  signInAction: (formData: FormData) => Promise<void>;
  signUpAction: (formData: FormData) => Promise<void>;
  forgotPasswordAction: (formData: FormData) => Promise<void>;
  privacyPolicyHref: string;
  termsOfServiceHref: string;
}

interface AuthButtonProps {
  action: (formData: FormData) => Promise<void>;
  label: string;
  variant?: 'default' | 'outline';
}

function SignInButton({ action, label, variant = 'default' }: AuthButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      formAction={action}
      disabled={pending}
      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
      variant={variant}
    >
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {label}
    </Button>
  );
}

function SignUpButton({ action, label, variant = 'outline' }: AuthButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      formAction={action}
      disabled={pending}
      className="w-full"
      variant={variant}
    >
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {label}
    </Button>
  );
}

export default function LoginForm({
  signInAction,
  signUpAction,
  forgotPasswordAction,
  privacyPolicyHref,
  termsOfServiceHref,
}: LoginFormProps) {
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleGitHubSignIn = async () => {
    setIsGitHubLoading(true);
    try {
      await NextAuthSignIn('github');
    } catch (error) {
      console.error('GitHub sign-in error:', error);
    } finally {
      setIsGitHubLoading(false);
    }
  };

  const onSubmit = async (
    values: z.infer<typeof formSchema>,
    event: React.FormEvent,
  ) => {
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    // Determine which action to call based on the button clicked, if needed
    // For now, let's assume default action is signIn
    // The server actions can then handle specific errors from NextAuth or DB
    await signInAction(formData);
  };

  return (
    <CardContent className="pt-0 sm:pt-2">
      <div className="flex flex-col gap-5 sm:gap-6">
        <Button
          variant="outline"
          className="w-full border-muted-foreground/40 hover:border-muted-foreground"
          onClick={handleGitHubSignIn}
          disabled={isGitHubLoading}
        >
          {isGitHubLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Github className="mr-2 h-4 w-4 align-middle" />
          )}
          <span className="align-middle">Login with Github</span>
        </Button>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-muted" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-3 text-muted-foreground tracking-wide font-medium">
              OR CONTINUE WITH
            </span>
          </div>
        </div>

        {!showForgotPassword ? (
          <form
            onSubmit={form.handleSubmit((values, event) =>
              onSubmit(values, event as React.FormEvent),
            )}
            className="flex flex-col gap-4 text-foreground"
          >
            {/* Email Field */}
            <div className="flex flex-col space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                className="h-10"
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <p
                  className="text-sm text-destructive"
                  role="alert"
                  aria-live="polite"
                >
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="mt-2 h-10"
                {...form.register('password')}
              />
              {form.formState.errors.password && (
                <p
                  className="text-sm text-destructive"
                  role="alert"
                  aria-live="polite"
                >
                  {form.formState.errors.password.message}
                </p>
              )}
              <Button
                variant="link"
                type="button"
                className="w-full justify-center px-0 mt-2 text-xs sm:text-sm font-medium text-primary hover:text-primary/80"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot your password?
              </Button>
            </div>

            <SignInButton action={signInAction} label="Sign In" />
            <SignUpButton action={signUpAction} label="Sign Up" />
          </form>
        ) : (
          <form
            action={forgotPasswordAction}
            className="flex flex-col gap-4 text-foreground"
          >
            <p className="text-sm text-muted-foreground">
              Enter your email address to receive a password reset link.
            </p>
            <div className="flex flex-col space-y-2">
              <Label htmlFor="forgot-email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="forgot-email"
                type="email"
                name="email"
                placeholder="m@example.com"
                required
                className="h-10"
              />
            </div>
            <SignInButton
              action={forgotPasswordAction}
              label="Send Reset Link"
            />
            <Button
              variant="link"
              type="button"
              className="w-full justify-center px-0 mt-2 text-xs sm:text-sm font-medium text-primary hover:text-primary/80"
              onClick={() => setShowForgotPassword(false)}
            >
              Back to login
            </Button>
          </form>
        )}

        <p className="px-0 text-center text-sm text-muted-foreground">
          By clicking continue, you agree to our{' '}
          <Link
            href={privacyPolicyHref}
            className="underline underline-offset-4 hover:text-primary"
          >
            Privacy Policy
          </Link>
          {' and '}
          <Link
            href={termsOfServiceHref}
            className="underline underline-offset-4 hover:text-primary"
          >
            Terms of Service
          </Link>
          .
        </p>
      </div>
    </CardContent>
  );
}
