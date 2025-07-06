import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface CardLoadingProps {
  width?: string;
  height?: string;
}

const CardLoading: React.FC<CardLoadingProps> = ({
  width = 'w-full',
  height = 'h-32',
}) => {
  return (
    <div
      className={`rounded-md ${width} ${height} animate-pulse bg-muted`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Skeleton className="w-full h-full" />
    </div>
  );
};

export default CardLoading;
