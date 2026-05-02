import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import TimeStamp from '@/components/TimeStamp';
import type { Metadata } from 'next';
import { getStaticContentBySlug } from '@/lib/mdx';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { MDXComponents } from '@/app/blog/components/mdx-components';
import { notFound } from 'next/navigation';

const PAGE_TITLE = 'Terms of Service - ScaleSmart';
const PAGE_DESCRIPTION =
  'Review the terms and conditions for using ScaleSmart services, tools, and platforms.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  keywords: [
    'terms of service',
    'legal',
    'conditions',
    'ScaleSmart',
    'agency terms',
  ],
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: 'https://www.scalesmart.com/terms-of-service',
    siteName: 'ScaleSmart',
    type: 'website',
  },
};

export default async function TermsOfServicePage() {
  const content = await getStaticContentBySlug('terms-of-service');

  if (!content) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="mx-auto flex max-w-6xl gap-8">
        <Card className="shadow-lg flex-grow">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-center text-primary">
              Terms of Service
            </CardTitle>
          </CardHeader>
          <p className="text-sm text-center text-muted-foreground mb-6">
            Last Updated: <TimeStamp date="2026-05-02" relative />
          </p>
          <CardContent className="space-y-6 text-foreground">
            <div className="prose dark:prose-invert max-w-none">
              <MDXRemote source={content.content} components={MDXComponents} />
            </div>
            <div className="text-center pt-4 border-t">
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
