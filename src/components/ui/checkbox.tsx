'use client';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Props for the Checkbox component.
 */
export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  /** Indicates if the checkbox is in an invalid state. */
  isInvalid?: boolean;
  /** The error message to display when the checkbox is invalid. */
  errorMessage?: string;
}

/**
 * Props for the Checkbox component.
 */
/**
 * A control that allows the user to toggle between checked and unchecked states.
 * Built using Radix UI Checkbox.
 * @see https://www.radix-ui.com/primitives/docs/components/checkbox
 */
const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps // Use the extended props interface
>(({ className, isInvalid, errorMessage, ...props }, ref) => (
  <>
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
        isInvalid && 'border-destructive focus-visible:ring-destructive', // Apply error styling
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn('flex items-center justify-center text-current')}
      >
        <Check className="h-4 w-4" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
    {isInvalid && errorMessage && (
      <p className="text-sm font-medium text-destructive mt-1">
        {errorMessage}
      </p>
    )}
  </>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
