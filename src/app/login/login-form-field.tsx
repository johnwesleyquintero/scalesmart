'use client';

import React from 'react';
import {
  UseFormRegister,
  FieldErrors,
  FieldValues,
  Path,
} from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react'; // Moved import to top for consistency and to resolve parsing errors
import {
  LoginFormValues,
  MfaFormValues,
  ForgotPasswordFormValues,
} from './login-types';

type FormValues = LoginFormValues | MfaFormValues | ForgotPasswordFormValues;

interface FormFieldProps<TFieldValues extends FieldValues> {
  id: string;
  name: Path<TFieldValues>;
  label: string;
  type: string;
  placeholder: string;
  registerAction: UseFormRegister<TFieldValues>; // Renamed to avoid conflict and clarify purpose
  errors: FieldErrors<TFieldValues>;
  disabled: boolean;
  autoComplete?: string;
  required?: boolean;
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePasswordVisibility?: () => void;
}

/**
 * Reusable FormField component for consistent input rendering and error display.
 * It integrates with react-hook-form for registration and error handling.
 */
export const FormField = <TFieldValues extends FieldValues>({
  id,
  name,
  label,
  type,
  placeholder,
  registerAction, // Directly use registerAction prop
  errors,
  disabled,
  autoComplete,
  required,
  showPasswordToggle,
  showPassword,
  onTogglePasswordVisibility,
}: FormFieldProps<TFieldValues>) => {
  const error = errors[name as string];

  return (
    <div className="flex flex-col space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          className={`h-10 ${showPasswordToggle ? 'pr-10' : ''}`}
          autoComplete={autoComplete}
          {...registerAction(name)}
          aria-invalid={error ? 'true' : 'false'}
          disabled={disabled}
          required={required}
        />
        {showPasswordToggle && onTogglePasswordVisibility && (
          <button
            type="button"
            className="absolute right-0 top-0 h-10 w-10 px-3 py-2 text-muted-foreground hover:text-foreground"
            onClick={onTogglePasswordVisibility}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            disabled={disabled}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      {error?.message && (
        <p className="text-sm text-destructive" role="alert" aria-live="polite">
          {String(error.message)}
        </p>
      )}
    </div>
  );
};
