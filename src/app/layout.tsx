'use client';

// Initialize mock service worker in the browser environment
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.warn(
    'Mock service worker is not initialized due to missing module: ../../mocks/browser',
  );
  // try {
  //   const { worker } = await import('../../mocks/browser');
  //   worker.start();
  // } catch (error) {
  //   console.error('Failed to initialize mock service worker:', error);
  // }
}

import ClientProviders from '@/components/client-providers';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ContentSkeleton } from '@/components/ui/loading-skeleton';
import { cn } from '@/lib/utils';
import type { Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: 'light dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={cn('min-h-screen font-sans antialiased', inter.variable)}
      >
        <script></script>
        <ErrorBoundary>
          <ClientProviders>
            <Suspense fallback={<ContentSkeleton />}>{children}</Suspense>
          </ClientProviders>
        </ErrorBoundary>
      </body>
    </html>
  );
}
