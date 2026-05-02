import ClientProviders from '@/components/client-providers';
import ApolloTracker from '@/components/apollo-tracker';

import { Analytics } from '@vercel/analytics/next';
import Footer from '@/components/footer'; // /* IMPORT THE FOOTER */
import Header from '@/components/header'; // /* IMPORT THE HEADER */
import { ErrorBoundary } from '@/components/error-boundary'; // Import ErrorBoundary for catching rendering errors
import { Toaster as SonnerToaster } from 'sonner'; // Import Sonner
import { Toaster } from '@/components/ui/toaster'; // Import Toaster
import { cn } from '@/lib/utils';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import {
  metadata as metadataConfig,
  viewport as viewportConfig,
} from './metadata';
// Authentication removed - using simplified approach

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

export const metadata: Metadata = metadataConfig;
export const viewport: Viewport = viewportConfig;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(inter.variable)} suppressHydrationWarning>
      <head>
        <ApolloTracker />
      </head>
      <body
        className="min-h-screen bg-body font-sans antialiased overflow-x-hidden text-base md:text-[16px] overscroll-none"
        suppressHydrationWarning
      >
        <div className="relative flex min-h-screen flex-col">
          <ErrorBoundary>
            <ClientProviders>
              <Header />
              <main className="flex-1 w-full px-4 sm:px-6 md:px-8">
                {children}
              </main>
              <Footer />
            </ClientProviders>
          </ErrorBoundary>
          <Toaster />
          <SonnerToaster />
        </div>
        <Analytics />
      </body>
    </html>
  );
}
