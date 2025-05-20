import ClientProviders from '@/components/client-providers';
import { Analytics } from "@vercel/analytics/next";
import Footer from '@/components/footer'; // <--- IMPORT THE FOOTER
import Header from '@/components/header'; // <--- IMPORT THE HEADER
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
        style={
          {
            /* Add background tile effect here */
          }
        }
        className={cn(
          'relative',
          'min-h-screen',
          'bg-gradient-to-br',
          'from-purple-50',
          'via-white',
          'to-blue-50',
          'dark:from-gray-900',
          'dark:via-gray-900',
          'dark:to-gray-800',
          'min-h-screen',
          'font-sans',
          'antialiased',
          'bg-background',
          'text-foreground',
          'flex',
          'flex-col',
          'selection:bg-primary/10',
          'selection:text-primary',
          'mx-auto',
          'flex',
          'justify-center',
        )}
      >
        <ClientProviders>
          <Header /> {/* <--- ADD THE GLOBAL HEADER HERE */}
          <main id="main" className="flex-1">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            {children}
          </main>
</ClientProviders>
       <Analytics />
     </body>
     <Footer />
   </html>
  );
}
