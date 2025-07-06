'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

interface CustomErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

function sanitize(html: string) {
  // Use a robust library like DOMPurify for production!
  return html.replace(/</g, '<').replace(/>/g, '>');
}

/**
 * Custom error component for displaying error information and providing actions.
 * This component is typically used within an Error Boundary.
 */
export default function CustomError({ error, reset }: CustomErrorProps) {
  // Log the error to the console for debugging purposes.
  // This is helpful for developers but not shown to the end user.
  useEffect(() => {
    console.error('CustomError:', error.message, error.stack, error.digest); // Log relevant parts
  }, [error]); // Dependency array ensures this runs only when the error object changes

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-premium-light dark:bg-premium-dark premium-pattern">
      <main className="container flex max-w-md flex-col items-center justify-center px-4 py-16 text-center premium-shadow">
        {/* Icon indicating an error */}
        <AlertTriangle className="mb-6 h-16 w-16 bg-accent-overlay" />

        {/* Main error message heading */}
        <h1 className="mb-4 text-2xl font-bold md:text-3xl">
          Something went wrong!
        </h1>

        {/* User-friendly explanation */}
        <p className="mb-8 text-muted-foreground">
          We apologize for the inconvenience. An unexpected error occurred:{' '}
          {sanitize(error.message)}
        </p>

        {/* Optional link to an error guide/documentation */}
        <p className="mb-8 text-sm text-muted-foreground">
          For more details see the{' '}
          <a href="/error-guide" className="underline">
            error guide
          </a>
          .
        </p>

        {/* Action buttons */}
        <div className="flex flex-col gap-4 sm:flex-row">
          {/* Button to trigger the reset function (e.g., retry rendering) */}
          <Button onClick={() => reset()} variant="primary">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>

          {/* Button linking back to the homepage */}
          <Button asChild variant="outline">
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
