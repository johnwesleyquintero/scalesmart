'use client';

'use client';

import { ThemeProvider } from '@/components/ui/theme-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, type ReactNode, Suspense } from 'react';

export default function ClientProviders({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered: ', registration);
          })
          .catch((registrationError) => {
            console.log(
              'Service Worker registration failed: ',
              registrationError,
            );
          });
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
