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
          <CardContent className="space-y-6 text-gray-700">
            <p className="text-lg font-semibold">
              This Privacy Policy describes how we collect, use, and protect
              your information when you use this application.
            </p>

            <section className="space-y-3 pl-4 border-l-4 border-primary">
              <h3 className="font-semibold">Data Storage</h3>
              <p>
                Currently, your data is stored locally within your web browser's
                IndexedDB. This is part of our free tier service. We do not
                collect or store any personal data on our servers at this time.
              </p>

              <h3 className="font-semibold">Data Usage</h3>
              <p>
                The stored data is used solely to provide the application's core
                functionality and improve your user experience. We do not share
                your data with any third parties.
              </p>

              <h3 className="font-semibold">User Rights</h3>
              <p>
                You have the right to access, modify, and delete your data. You
                can do this by clearing your browser's site data. We also
                encourage you to use any available "Export" features to back up
                your data.
              </p>

              <h3 className="font-semibold">Future Plans</h3>
              <p>
                We are planning to introduce a paid tier with cloud storage. We
                will update this policy to reflect any changes in data handling
                practices when this feature is available.
              </p>

              <h3 className="font-semibold">Third-Party Services</h3>
              <p>
                This application does not utilize any third-party services that
                collect user data.
              </p>
            </section>

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
