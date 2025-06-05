'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { mfaFormSchema } from './login-schemas';
import { SubmitButton } from './login-helper-components';
import { CurrentFormState } from './login-types';

interface MfaVerificationFormProps {
  mfaForm: UseFormReturn<z.infer<typeof mfaFormSchema>>;
  handleMfaSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isMfaPending: boolean;
  setCurrentForm: (form: CurrentFormState) => void;
  clearGeneralMessage: () => void;
}

/**
 * Component for the MFA Verification Form.
 * Handles the MFA code input field, validation messages, and verify/cancel buttons.
 */
export default function MfaVerificationForm({
  mfaForm,
  handleMfaSubmit,
  isMfaPending,
  setCurrentForm,
  clearGeneralMessage,
}: MfaVerificationFormProps) {
  return (
    <form
      onSubmit={handleMfaSubmit}
      className="flex flex-col gap-4 text-foreground"
      noValidate
    >
      <div className="flex flex-col space-y-2">
        <Label htmlFor="mfaCode" className="text-sm font-medium">
          MFA Code
        </Label>
        <Input
          id="mfaCode"
          type="text"
          placeholder="Enter your MFA code"
          className="h-10"
          autoComplete="one-time-code"
          {...mfaForm.register('mfaCode')}
          aria-invalid={mfaForm.formState.errors.mfaCode ? 'true' : 'false'}
          disabled={isMfaPending}
        />
        {mfaForm.formState.errors.mfaCode && (
          <p
            className="text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            {mfaForm.formState.errors.mfaCode.message}
          </p>
        )}
      </div>
      {/* MFA Verify Button */}
      <SubmitButton label="Verify Code" pending={isMfaPending} />
      {/* Cancel MFA Button */}
      <Button
        type="button"
        variant="ghost"
        className="mt-2"
        onClick={() => {
          setCurrentForm('login');
          mfaForm.reset();
          mfaForm.clearErrors();
          clearGeneralMessage();
        }}
        disabled={isMfaPending}
      >
        Cancel
      </Button>
    </form>
  );
}
