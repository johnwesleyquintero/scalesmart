'use client';

import { ThemeProvider } from '@/components/ui/theme-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { useState, type ReactNode, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

const ChatInterface = dynamic(() => import('@/components/ui/chat-interface'), {
  ssr: false, // Ensure this component is not server-rendered
});

import { Session } from 'next-auth'; // Import Session type

export default function ClientProviders({
  children,
  session, // Destructure session prop
}: {
  readonly children: ReactNode;
  readonly session: Session | null; // Define type for session prop
}) {
  const [queryClient] = useState(() => new QueryClient());
  const pathname = usePathname();

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={session}>
        {' '}
        {/* Pass session prop */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          {pathname === '/chat' && (
            <Suspense fallback={null}>
              <ChatInterface />
            </Suspense>
          )}
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
