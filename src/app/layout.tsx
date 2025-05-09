import ClientProviders from '@/components/client-providers';
import { cn } from '@/lib/utils';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { metadata as metadataConfig } from './metadata';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
      <body
        suppressHydrationWarning
        className={cn(
          'min-h-screen',
          'font-sans',
          'antialiased',
          'bg-background',
          'text-foreground',
          'flex',
          'flex-col',
          'selection:bg-primary/10',
          'selection:text-primary',
        )}
      >
        <ClientProviders>
          <main id="main" className="flex-1">
            {children}
          </main>
        </ClientProviders>
      </body>
    </html>
  );
}
