'use client';

import { ThemeProvider } from '@/components/ui/theme-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { useState, type ReactNode } from 'react';

export default function ClientProviders({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
