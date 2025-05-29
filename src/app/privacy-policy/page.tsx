'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

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
            Last Updated: May 21, 2025
          </p>
          <CardContent className="space-y-6 text-gray-700">
            <p className="text-lg font-semibold">
              This Privacy Policy describes how we collect, use, and protect
              your information when you use this application.
            </p>
            {/* Wrap the main policy points in a div to apply shared styling */}
            <div className="space-y-6 pl-4 border-l-4 border-primary">
              <section className="space-y-3">
                <h3 className="font-semibold">Data Storage</h3>
                <p>
                  Currently, your data is stored locally within your web
                  browser&apos;s IndexedDB. This is part of our free tier
                  service. We do not collect or store any personal data on our
                  servers at this time.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="font-semibold">Data Usage</h3>
                <p>
                  The stored data is used solely to provide the
                  application&apos;s core functionality and improve your user
                  experience. We do not share your data with any third parties.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="font-semibold">User Rights</h3>
                <p>
                  You have the right to access, modify, and delete your data.
                  You can do this by clearing your browser&apos;s site data. We
                  also encourage you to use any available &quot;Export&quot;
                  features to back up your data.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="font-semibold">Future Plans</h3>
                <p>
                  We are planning to introduce a paid tier with cloud storage.
                  We will update this policy to reflect any changes in data
                  handling practices when this feature is available.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="font-semibold">Third-Party Services</h3>
                <p>
                  For the core functionality of this application, we do not
                  utilize third-party services that collect your personal data.
                </p>
                <p>
                  We use Vercel Analytics to understand general traffic patterns
                  and improve our website. Vercel Analytics is designed to be
                  privacy-focused and collects anonymized, aggregated data. It
                  does not track individual users or use cookies for tracking
                  purposes.
                </p>
              </section>
            </div>{' '}
            {/* End of wrapped policy points */}
            <p className="text-sm text-center text-gray-500 pt-4">
              We may update this policy periodically. Any significant changes
              will be communicated to users through the application or via
              email.
            </p>
            <p className="text-sm text-center text-gray-500 pt-4">
              For any questions or concerns regarding this Privacy Policy,
              please contact us at johnwesleyquintero@gmail.com.
            </p>
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
