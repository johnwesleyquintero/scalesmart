'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { formSchema } from './login-schemas';
import {
  SubmitButton,
  PasswordStrengthIndicator,
} from './login-helper-components';
import { CurrentFormState } from './login-types';
import { useState } from 'react';

interface EmailPasswordLoginFormProps {
  loginForm: UseFormReturn<z.infer<typeof formSchema>>;
  handleLoginSubmitAction: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isLoginPending: boolean;
  isAnyActionPending: boolean;
  setCurrentFormAction: (form: CurrentFormState) => void;
  clearGeneralMessageAction: () => void;
}

/**
 * Component for the Email/Password Login Form.
 * Handles input fields, validation messages, password visibility toggle,
 * forgot password link, sign-in button, and sign-up link.
 */
export default function EmailPasswordLoginForm({
  loginForm,
  handleLoginSubmitAction,
  isLoginPending,
  isAnyActionPending,
  setCurrentFormAction,
  clearGeneralMessageAction,
}: EmailPasswordLoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form
      onSubmit={handleLoginSubmitAction}
      className="flex flex-col gap-4 text-foreground"
      noValidate
    >
      {/* Email Field */}
      <div className="flex flex-col space-y-2">
        <Label htmlFor="email-login" className="text-sm font-medium">
          Email
        </Label>
        <Input
          id="email-login"
          type="email"
          placeholder="m@example.com"
          className="h-10"
          autoComplete="email"
          {...loginForm.register('email')}
          aria-invalid={loginForm.formState.errors.email ? 'true' : 'false'}
          disabled={isLoginPending}
        />
        {loginForm.formState.errors.email && (
          <p
            className="text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            {loginForm.formState.errors.email.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <Label htmlFor="password-login" className="text-sm font-medium">
          Password
        </Label>
        <div className="relative mt-2">
          <Input
            id="password-login"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className="h-10 pr-10"
            autoComplete="current-password"
            {...loginForm.register('password')}
            aria-invalid={
              loginForm.formState.errors.password ? 'true' : 'false'
            }
            disabled={isLoginPending}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-10 w-10 px-3 py-2"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            disabled={isLoginPending}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {loginForm.formState.errors.password && (
          <p
            className="text-sm text-destructive mt-2"
            role="alert"
            aria-live="polite"
          >
            {loginForm.formState.errors.password.message}
          </p>
        )}
        {loginForm.watch('password') && (
          <PasswordStrengthIndicator password={loginForm.watch('password')} />
        )}
        <Button
          variant="link"
          type="button"
          className="w-full justify-center px-0 mt-2 text-sm sm:text-base font-semibold text-primary hover:text-primary/80"
          onClick={() => {
            setCurrentFormAction('forgotPassword');
            loginForm.reset();
            loginForm.clearErrors();
            clearGeneralMessageAction();
          }}
          disabled={isLoginPending}
        >
          Forgot your password?
        </Button>
      </div>

      {/* Sign In Button */}
      <SubmitButton
        label="Sign In"
        pending={isLoginPending}
        disabled={isLoginPending}
      />

      {/* Sign Up Link */}
      <Link href="/signup" passHref legacyBehavior>
        <Button
          variant="outline"
          className="w-full border-muted-foreground/40 hover:border-muted-foreground"
          disabled={isAnyActionPending}
        >
          Sign Up
        </Button>
      </Link>
    </form>
  );
}
