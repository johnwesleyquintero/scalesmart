import { Metadata } from 'next';

const SITE_DESCRIPTION =
  'ScaleSmart is a digital solutions agency helping businesses move faster, operate smarter, and scale without chaos through optimized systems and workflows.';
const AUTHOR_NAME = 'ScaleSmart';

const AUTHOR_URL = 'https://scalesmart.vercel.app';
const FAVICON_PATH = '/images/agency-assets/images/logo_no_bg_no_text.png';

export const metadata: Metadata = {
  title: `ScaleSmart | Digital Solutions & Automation Agency`,
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
    url: 'https://scalesmart.vercel.app',
    title: `ScaleSmart | E-commerce Operations Specialist`,
    description: `High-performance systems to reduce errors and support business growth.`,
    siteName: `ScaleSmart Portfolio`,
    images: [
      {
        url: 'https://scalesmart.vercel.appog-image.svg',
        width: 1200,
        height: 630,
        alt: `${AUTHOR_NAME} Portfolio`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `ScaleSmart | E-commerce Operations & Automation`,
    description: `Stable e-commerce operations through repeatable systems and AI-driven automation.`,
    images: ['https://scalesmart.vercel.appog-image.svg'],
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
  metadataBase:
    process.env.NODE_ENV === 'development'
      ? new URL('https://localhost:3000')
      : new URL('https://wescode.vercel.app'),
  verification: {
    google: 'NbiFbRYrEPdp5H7cgQBcAhLd8zC9wuKjDseZAW5TtzU',
  },
  alternates: {
    canonical: './',
  },
  generator: 'Next.js',
  applicationName: `${AUTHOR_NAME} Portfolio`,
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
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
