import Footer from '@/components/footer';
import Header from '@/components/header';
import type { Metadata, Viewport } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Blog | Wesley Quintero',
  description:
    'Insights and strategies for Amazon sellers and e-commerce businesses.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

export default function BlogLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
