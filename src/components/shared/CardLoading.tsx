import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface CardLoadingProps {
  className?: string;
  count?: number;
}

const CardLoading: React.FC<CardLoadingProps> = ({ className, count = 1 }) => {
  return (
    <div className="w-full space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'rounded-xl border bg-card p-4 shadow-sm animate-in fade-in duration-500',
            className,
          )}
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex flex-col gap-4">
            <Skeleton className="h-6 w-3/4 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <div className="flex justify-between items-center mt-2">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CardLoading;
