import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * Defines the button's visual variants and sizes using class-variance-authority (cva).
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] hover:scale-[1.02]',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg hover:from-blue-700 hover:to-indigo-800 hover:shadow-xl focus:ring-blue-500',
        destructive:
          'bg-gradient-to-r from-red-500 to-red-600 text-white shadow hover:from-red-600 hover:to-red-700 focus:ring-red-500',
        outline:
          'border-2 border-blue-200 bg-background text-blue-700 shadow-sm hover:bg-blue-50 hover:border-blue-300 hover:text-blue-800 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950 dark:hover:border-blue-700 focus:ring-blue-500',
        secondary:
          'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 shadow-sm hover:from-gray-200 hover:to-gray-300 focus:ring-gray-500',
        tertiary:
          'bg-gray-100 text-gray-800 hover:bg-gray-200 hover:text-gray-900 focus:ring-gray-500',
        ghost: 'hover:bg-accent hover:text-accent-foreground hover:scale-100',
        link: 'text-primary underline-offset-4 hover:underline hover:scale-100',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

/**
 * Props for the Button component.
 * Extends standard HTML button attributes and variant props defined by `buttonVariants`.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * If true, the button will be rendered as a child of the element passed to it.
   * Useful for integrating with routing libraries like `react-router-dom` or `next/link`.
   */
  asChild?: boolean;
}

/**
 * A customizable button component with support for different variants, sizes,
 * and rendering as a child element.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
