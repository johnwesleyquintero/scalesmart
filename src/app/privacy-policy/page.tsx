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
              Our Super Transparent Privacy & Data Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-gray-700">
            <p className="text-lg font-semibold">
              Hey there, valued user of these awesome local tools!
            </p>
            <p>
              We believe in radical transparency, especially when it comes to
              your data. So, here's the deal:
            </p>

            <div className="space-y-3 pl-4 border-l-4 border-primary">
              <p>
                <strong>
                  Your Data, Your Browser, Your Fortress (Mostly):
                </strong>
                All the brilliant tasks, customer notes, and course progress you
                create here? It all lives snugly in your web browser's local
                storage. We don't peek, we don't collect, it's all yours.
              </p>
              <p>
                <strong>The "Oops, I Deleted It" Button is Yours Too:</strong>{' '}
                You hold the keys to the kingdom (and the delete button). If you
                clear your browser's site data, poof! Your local data vanishes.
                No cloud backups here, folks.
              </p>
              <p>
                <strong>Export is Your Best Friend:</strong> If your data is
                precious (and we bet it is!), keep an eye out for any "Export"
                features we might add. Use them. Love them. Don't say we didn't
                warn you if your browser decides to have a digital spring
                cleaning.
              </p>
            </div>
            <p className="text-sm text-center text-gray-500 pt-4">
              In short: What happens in your browser, stays in your browser...
              until you clear it.
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
