'use client';

'use client';

import { ThemeProvider } from '@/components/ui/theme-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { useState, useEffect, type ReactNode, Suspense } from 'react';

import { Session } from 'next-auth'; // Import Session type

export default function ClientProviders({
  children,
  session, // Destructure session prop
}: {
  readonly children: ReactNode;
  readonly session: Session | null; // Define type for session prop
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
      <SessionProvider session={session}>
        {' '}
        {/* Pass session prop */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
