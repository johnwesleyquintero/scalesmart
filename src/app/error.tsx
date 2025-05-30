'use client';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function CustomError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-premium-light dark:bg-premium-dark premium-pattern">
      <div className="container flex max-w-md flex-col items-center justify-center px-4 py-16 text-center premium-shadow">
        <AlertTriangle className="mb-6 h-16 w-16 bg-accent-overlay" />
        <h1 className="mb-4 text-2xl font-bold md:text-3xl">
          Something went wrong!
        </h1>
        <p className="mb-8 text-muted-foreground">
          We apologize for the inconvenience. An unexpected error has occurred.
        </p>
        {/* New error documentation note */}
        <p className="mb-8 text-sm text-muted-foreground">
          For more details see the{' '}
          <a href="/error-guide" className="underline">
            error guide
          </a>
          .
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button
            onClick={reset}
            variant="default"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button asChild variant="outline">
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
