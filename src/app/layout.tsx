import ClientProviders from '@/components/client-providers';
import { Analytics } from '@vercel/analytics/next';
import Footer from '@/components/footer'; // /* IMPORT THE FOOTER */
import Header from '@/components/header'; // /* IMPORT THE HEADER */
import { ErrorBoundary } from '@/components/error-boundary'; // Import ErrorBoundary for catching rendering errors
import { Toaster } from '@/components/ui/toaster'; // Import Toaster
import { cn } from '@/lib/utils';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { metadata as metadataConfig } from './metadata';
import { getServerSession } from 'next-auth'; // Import getServerSession
import { authOptions } from '@/lib/auth'; // Import your authOptions

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

export const metadata: Metadata = metadataConfig;

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions); // Fetch session data

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-body font-sans antialiased overflow-x-hidden text-base md:text-[16px] overscroll-none">
        <div className="relative flex min-h-screen flex-col">
          <ErrorBoundary>
            <ClientProviders session={session}>
              {' '}
              {/* Pass session to ClientProviders */}
              <Header />
              <main className="flex-1 w-full px-4 sm:px-6 md:px-8">
                {children}
              </main>
              <Footer />
            </ClientProviders>
          </ErrorBoundary>
          <Toaster />
        </div>
        <Analytics />
      </body>
    </html>
  );
}
