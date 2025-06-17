import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Props for the Input component.
 * Extends standard HTML input attributes.
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string | number;
  type?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min?: string | number;
  step?: string | number;
  name?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  /** Indicates if the input is in an invalid state. */
  isInvalid?: boolean;
  /** The error message to display when the input is invalid. */
  errorMessage?: string;
}

/**
 * A styled input component.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      value,
      onChange,
      min,
      step,
      name,
      placeholder,
      required,
      isInvalid,
      errorMessage,
      ...props
    },
    ref,
  ) => {
    return (
      <>
        <input
          type={type}
          value={value}
          onChange={onChange}
          min={min}
          step={step}
          name={name}
          placeholder={placeholder}
          required={required}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            isInvalid && 'border-destructive focus-visible:border-destructive',
            className,
          )}
          ref={ref}
          {...props}
        />
        {isInvalid && errorMessage && (
          <p className="text-sm font-medium text-destructive mt-1">
            {errorMessage}
          </p>
        )}
      </>
    );
  },
);
Input.displayName = 'Input';

export { Input };
