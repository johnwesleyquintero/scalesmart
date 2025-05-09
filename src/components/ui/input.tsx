import * as React from 'react';

import { cn } from '@/lib/utils';

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
}

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
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
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
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
