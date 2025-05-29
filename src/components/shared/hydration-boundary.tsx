'use client';

import { HydrationBoundary as RQHydrationBoundary } from '@tanstack/react-query';
import { Suspense, useEffect, useState } from 'react';
import { getQueryClient } from '@/lib/query-client';

interface HydrationBoundaryProps {
  children: React.ReactNode;
  state?: unknown;
}

export default function HydrationBoundary({
  children,
  state,
}: HydrationBoundaryProps) {
  const [mounted, setMounted] = useState(false);
  const queryClient = getQueryClient();

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RQHydrationBoundary state={state}>{children}</RQHydrationBoundary>
    </Suspense>
  );
}
