'use client';

import React, { forwardRef } from 'react';
import { TabsTrigger } from '@/components/ui/tabs';

interface CRMTabsTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  value: string;
  children: React.ReactNode;
}

const CRMTabsTrigger = forwardRef<HTMLButtonElement, CRMTabsTriggerProps>(
  ({ value, children, className, ...props }, ref) => {
    return (
      <TabsTrigger
        {...props}
        value={value}
        className={`data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground ${className || ''}`}
        ref={ref}
      >
        {children}
      </TabsTrigger>
    );
  },
);

CRMTabsTrigger.displayName = 'CRMTabsTrigger';

export { CRMTabsTrigger };
