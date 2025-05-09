import { Metadata } from 'next';

const defaultImage = '/default-fallback.svg';
const SITE_DESCRIPTION =
  'Data-Driven Amazon & E-commerce Specialist portfolio website.';
const AUTHOR_NAME = 'Wesley Quintero'; // Define a constant for the author's name
const FAVICON_PATH = '/favicon.svg'; // Define a constant for the favicon path

export const metadata: Metadata = {
  title: `${AUTHOR_NAME} - Professional Portfolio`,
  description: SITE_DESCRIPTION,
  keywords: [
    AUTHOR_NAME,
    'Amazon Specialist',
    'Data Analytics',
    'E-commerce',
    'Amazon Seller Tools',
    'Portfolio',
    'Amazon SEO',
    'PPC Optimization',
    'Data Visualization',
    'SellSmart Hub',
    'DevFlowDB',
  ],
  authors: [
    { name: AUTHOR_NAME, url: 'https://github.com/johnwesleyquintero' },
  ],
  creator: AUTHOR_NAME,
  publisher: AUTHOR_NAME,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://wesleyquintero.vercel.app/',
    title: `${AUTHOR_NAME} | Data Analytics Innovator`,
    description:
      'Data Analytics Innovator and Founder of Nebula Suite, building tools that streamline workflows and provide valuable insights.',
    siteName: `${AUTHOR_NAME} Portfolio`,
    images: [
      {
        url: 'https://wesleyquintero.vercel.app/og-image.svg',
        width: 1200,
        height: 630,
        alt: `${AUTHOR_NAME} Portfolio`,
      },
      {
        url: `https://wesleyquintero.vercel.app${defaultImage}`,
        width: 1200,
        height: 630,
        alt: `${AUTHOR_NAME} Portfolio Fallback`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${AUTHOR_NAME} | Data Analytics Innovator`,
    description:
      'Data Analytics Innovator and Founder of Nebula Suite, building tools that streamline workflows and provide valuable insights.',
    images: [
      'https://wesleyquintero.vercel.app/og-image.svg',
      `https://wesleyquintero.vercel.app${defaultImage}`,
    ],
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
  manifest: '/site.webmanifest',
  metadataBase:
    process.env.NODE_ENV === 'development'
      ? new URL('https://localhost:3000')
      : new URL('https://wesleyquintero.vercel.app'),
  verification: {
    google: 'google-site-verification-code', // Replace with actual code
  },
  alternates: {
    canonical: 'https://wesleyquintero.vercel.app',
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
  maximumScale: 1,
  userScalable: false,
};
