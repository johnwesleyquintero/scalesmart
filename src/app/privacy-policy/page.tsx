import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import ArticleModule from '@/components/shared/ArticleModule';
import TimeStamp from '@/components/TimeStamp';
import type { Metadata } from 'next';

const PAGE_TITLE = 'Privacy Policy - ScaleSmart Platform';
const PAGE_DESCRIPTION =
  'Understand how ScaleSmart Platform collects, uses, and protects your personal data. Our comprehensive privacy policy details our data handling practices.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords: [
    'privacy policy',
    'data protection',
    'data security',
    'ScaleSmart',
    'terms',
  ],
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: 'https://www.scalesmart.com/privacy-policy',
    siteName: 'ScaleSmart Platform',
    images: [
      {
        url: '/og-image.svg', // Using a relative path for images in the public directory
        width: 1200,
        height: 630,
        alt: 'ScaleSmart Privacy Policy',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: ['/twitter-image.svg'], // Using a relative path for images in the public directory
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="mx-auto flex max-w-6xl gap-8">
        {' '}
        {/* Adjusted max-width and added flex */}
        <Card className="shadow-lg flex-grow">
          {' '}
          {/* Added flex-grow to card */}
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-center text-primary">
              Privacy Policy
            </CardTitle>
          </CardHeader>
          <p className="text-sm text-center text-muted-foreground mb-6">
            Last Updated: <TimeStamp date="2025-05-21" relative />
          </p>
          <CardContent className="space-y-6 text-foreground">
            <ArticleModule contentSlug="privacy-policy" />
            <div className="text-center pt-4">
              <Link href="/" className="text-primary hover:underline">
                &larr; Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
