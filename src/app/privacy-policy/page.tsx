'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import ArticleModule from '@/app/academy/components/ArticleModule';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-center text-primary">
              Privacy Policy
            </CardTitle>
          </CardHeader>
          <p className="text-sm text-center text-gray-500 mb-6">
            {/* Last Updated: <TimeStamp date="2025-05-21" relative /> */}
            Last Updated: May 21, 2025
          </p>
          <CardContent className="space-y-6 text-gray-700">
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
