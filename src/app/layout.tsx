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
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        inter.variable,
        'scroll-smooth',
        'motion-safe:scroll-smooth',
        '[color-scheme:dark_light]',
      )}
    >
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5"
        />
        <meta
          name="theme-color"
          content="#ffffff"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="#000000"
          media="(prefers-color-scheme: dark)"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-app-status-bar-style"
          content="black-translucent"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-background font-sans antialiased overflow-x-hidden text-base md:text-[16px] overscroll-none"
      >
        <div className="relative flex min-h-screen flex-col">
          {/* Wrap children with ErrorBoundary to catch rendering errors within the page content */}
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
        {/* <Analytics /> */}
        {/* Accessibility Enhancement Reminder:
          1. Conduct regular accessibility audits using tools like Axe or Lighthouse.
          2. Track the impact of these changes using the following metrics:
            * Accessibility audit scores (e.g., Lighthouse score)
            * User feedback on accessibility
            * Reduction in accessibility-related support tickets
        */}
      </body>
    </html>
  );
}
