import React from 'react';
import { cn } from '@/lib/utils';

interface CharacterCounterProps {
  current: number;
  max?: number;
  className?: string;
  warningThreshold?: number;
}

const CharacterCounter: React.FC<CharacterCounterProps> = ({
  current,
  max = 2000,
  className,
  warningThreshold = 0.8,
}) => {
  const percentage = (current / max) * 100;
  const isNearLimit = percentage >= warningThreshold * 100;
  const isOverLimit = current > max;

  return (
    <div
      className={cn(
        'text-xs flex items-center gap-1',
        isOverLimit
          ? 'text-red-500'
          : isNearLimit
            ? 'text-orange-500'
            : 'text-muted-foreground',
        className,
      )}
    >
      <span>{current}</span>
      {max && <span>/{max}</span>}
      {isOverLimit && <span className="font-medium">(over limit)</span>}
    </div>
  );
};

export default CharacterCounter;
