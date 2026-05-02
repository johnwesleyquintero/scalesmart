'use client';

import React from 'react';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: 0 | 100 | 200 | 300;
  direction?: 'up' | 'none';
  threshold?: number;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  direction = 'up',
  threshold = 0.1,
}: FadeInProps) {
  const { ref, inView } = useInView({
    threshold,
    triggerOnce: true,
  });

  const animationClass =
    direction === 'up' ? 'animate-fade-in-up' : 'animate-fade-in';
  const delayClass = delay > 0 ? `animation-delay-${delay}` : '';

  return (
    <div
      ref={ref}
      className={cn(
        'opacity-0',
        inView && animationClass,
        inView && delayClass,
        className,
      )}
    >
      {children}
    </div>
  );
}
