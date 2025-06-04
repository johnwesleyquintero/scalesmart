'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Github, Loader2, Eye, EyeOff, Check, X } from 'lucide-react';
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
    .max(50, 'Password must not exceed 50 characters.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character',
    ),
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
      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground hidden md:inline-flex"
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

function PasswordStrengthIndicator({ password }: { password: string }) {
  const requirements = [
    { regex: /.{8,}/, text: 'At least 8 characters' },
    { regex: /[A-Z]/, text: 'One uppercase letter' },
    { regex: /[a-z]/, text: 'One lowercase letter' },
    { regex: /[0-9]/, text: 'One number' },
    { regex: /[^A-Za-z0-9]/, text: 'One special character' },
  ];

  return (
    <div className="space-y-2 mt-2">
      {requirements.map((requirement, index) => (
        <div key={index} className="flex items-center space-x-2">
          {requirement.regex.test(password) ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <X className="h-4 w-4 text-destructive" />
          )}
          <span className="text-sm text-muted-foreground">
            {requirement.text}
          </span>
        </div>
      ))}
    </div>
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
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange',
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
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    const formData = new FormData(event.currentTarget);
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
              onSubmit(values, event as React.FormEvent<HTMLFormElement>),
            )}
            className="flex flex-col gap-4 text-foreground"
            noValidate
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
                autoComplete="email"
                {...form.register('email')}
                aria-invalid={form.formState.errors.email ? 'true' : 'false'}
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
              <div className="relative mt-2">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="h-10 pr-10"
                  autoComplete="current-password"
                  {...form.register('password')}
                  aria-invalid={
                    form.formState.errors.password ? 'true' : 'false'
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-10 w-10 px-3 py-2"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {form.formState.errors.password && (
                <p
                  className="text-sm text-destructive mt-2"
                  role="alert"
                  aria-live="polite"
                >
                  {form.formState.errors.password.message}
                </p>
              )}
              <PasswordStrengthIndicator password={form.watch('password')} />
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
            <div className="flex flex-col space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                className="h-10"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Reset Password
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="mt-2"
              onClick={() => setShowForgotPassword(false)}
            >
              Back to Login
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          By continuing, you agree to our{' '}
          <Link
            href={termsOfServiceHref}
            className="underline underline-offset-4 hover:text-primary"
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href={privacyPolicyHref}
            className="underline underline-offset-4 hover:text-primary"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </CardContent>
  );
}
