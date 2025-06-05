'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { forgotPasswordFormSchema } from './login-schemas';
import { SubmitButton } from './login-helper-components';
import { CurrentFormState } from './login-types';

interface ForgotPasswordFormProps {
  forgotPasswordForm: UseFormReturn<z.infer<typeof forgotPasswordFormSchema>>;
  handleForgotPasswordSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isForgotPending: boolean;
  setCurrentForm: (form: CurrentFormState) => void;
  clearGeneralMessage: () => void;
}

/**
 * Component for the Forgot Password Form.
 * Handles the email input field, validation messages, and send reset link/back to login buttons.
 */
export default function ForgotPasswordForm({
  forgotPasswordForm,
  handleForgotPasswordSubmit,
  isForgotPending,
  setCurrentForm,
  clearGeneralMessage,
}: ForgotPasswordFormProps) {
  return (
    <form
      onSubmit={handleForgotPasswordSubmit}
      className="flex flex-col gap-4 text-foreground"
      noValidate
    >
      <div className="flex flex-col space-y-2">
        <Label htmlFor="email-forgot" className="text-sm font-medium">
          Email
        </Label>
        <Input
          id="email-forgot"
          type="email"
          placeholder="m@example.com"
          className="h-10"
          autoComplete="email"
          {...forgotPasswordForm.register('email')}
          aria-invalid={
            forgotPasswordForm.formState.errors.email ? 'true' : 'false'
          }
          disabled={isForgotPending}
        />
        {forgotPasswordForm.formState.errors.email && (
          <p
            className="text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            {forgotPasswordForm.formState.errors.email.message}
          </p>
        )}
      </div>
      {/* Reset Password Button */}
      <SubmitButton label="Send Reset Link" pending={isForgotPending} />
      {/* Back to Login Button */}
      <Button
        type="button"
        variant="ghost"
        className="mt-2"
        onClick={() => {
          setCurrentForm('login');
          forgotPasswordForm.reset();
          forgotPasswordForm.clearErrors();
          clearGeneralMessage();
        }}
        disabled={isForgotPending}
      >
        Back to Login
      </Button>
    </form>
  );
}
