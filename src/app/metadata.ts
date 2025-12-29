import { Metadata } from 'next';

const SITE_DESCRIPTION =
  'Data Analytics Innovator and Founder of ScaleSmart, building tools that streamline workflows and provide valuable insights.';
const AUTHOR_NAME = 'Wesley Quintero';
const AUTHOR_URL = 'https://github.com/johnwesleyquintero';
const FAVICON_PATH = '/favicon.svg';
const MANIFEST_PATH = '/site.webmanifest';

export const metadata: Metadata = {
  title: `${AUTHOR_NAME} - Professional Portfolio`,
  description: SITE_DESCRIPTION,
  keywords: [
    AUTHOR_NAME,
    'Data Analytics',
    'E-commerce',
    'Portfolio',
    'Data Visualization',
  ],
  authors: [{ name: AUTHOR_NAME, url: AUTHOR_URL }],
  creator: AUTHOR_NAME,
  publisher: AUTHOR_NAME,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://wescode.vercel.app/',
    title: `${AUTHOR_NAME} | Data Analytics Innovator`,
    description: SITE_DESCRIPTION,
    siteName: `${AUTHOR_NAME} Portfolio`,
    images: [
      {
        url: 'https://wescode.vercel.app/og-image.svg',
        width: 1200,
        height: 630,
        alt: `${AUTHOR_NAME} Portfolio`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${AUTHOR_NAME} | Data Analytics Innovator`,
    description: SITE_DESCRIPTION,
    images: ['https://wescode.vercel.app/og-image.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: FAVICON_PATH,
    shortcut: FAVICON_PATH,
    apple: FAVICON_PATH,
    other: [
      {
        rel: 'mask-icon',
        url: FAVICON_PATH,
        color: '#000000',
      },
    ],
  },
  manifest: MANIFEST_PATH,
  metadataBase:
    process.env.NODE_ENV === 'development'
      ? new URL('https://localhost:3000')
      : new URL('https://wescode.vercel.app'),
  verification: {
    google: 'NbiFbRYrEPdp5H7cgQBcAhLd8zC9wuKjDseZAW5TtzU',
  },
  alternates: {
    canonical: '/',
  },
  generator: 'Next.js',
  applicationName: `${AUTHOR_NAME} Portfolio`,
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
};

import type { Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'auto', // Changed to 'auto'
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};
