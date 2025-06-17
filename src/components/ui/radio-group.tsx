'use client';

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { Circle } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

interface RadioGroupProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {
  /** Indicates if the radio group is in an invalid state. */
  isInvalid?: boolean;
  /** The error message to display when the radio group is invalid. */
  errorMessage?: string;
}

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps // Use the extended props interface
>(({ className, isInvalid, errorMessage, ...props }, ref) => {
  return (
    <>
      <RadioGroupPrimitive.Root
        className={cn('grid gap-2', className)}
        {...props}
        ref={ref}
      />
      {isInvalid && errorMessage && (
        <p className="text-sm font-medium text-destructive mt-1">
          {errorMessage}
        </p>
      )}
    </>
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> & {
    isInvalid?: boolean;
  } // Add isInvalid prop for styling
>(({ className, isInvalid, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        isInvalid && 'border-destructive focus-visible:ring-destructive', // Apply error styling
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
