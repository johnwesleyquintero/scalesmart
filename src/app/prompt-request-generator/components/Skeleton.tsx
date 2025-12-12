import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div
      className={cn(
        'animate-pulse bg-gradient-to-r from-muted/50 to-muted/30 rounded-md',
        className,
      )}
    />
  );
};

interface PromptOutputSkeletonProps {
  lines?: number;
}

export const PromptOutputSkeleton: React.FC<PromptOutputSkeletonProps> = ({
  lines = 8,
}) => {
  return (
    <div className="space-y-3 p-4">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-16" />
      </div>

      {/* Content skeleton */}
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 ? 'w-3/4' : 'w-full')}
        />
      ))}

      {/* Additional skeleton for markdown elements */}
      <div className="mt-4 space-y-3">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
};

export default Skeleton;
