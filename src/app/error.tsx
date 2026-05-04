'use client';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Home, RefreshCw, Copy, ServerCrash } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface CustomErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

/**
 * An epic, environment-aware error component for Next.js's `error.tsx`.
 * - In Development: Shows a detailed debug screen with a one-click AI prompt.
 * - In Production: Shows a clean, user-friendly message.
 */
export default function CustomError({ error, reset }: CustomErrorProps) {
  const [isCopied, setIsCopied] = useState(false);

  // Log the error to the console in all environments for standard debugging.
  useEffect(() => {
    console.error('An error was caught:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest, // The digest is a server-side error hash in Next.js
    });
  }, [error]);

  const generateAIPrompt = (): string => {
    // The 'digest' is a unique hash for a server-side error. Including it
    // helps correlate server logs with a specific client-side error.
    const digestInfo = error.digest
      ? `**Server Error Digest:**\n\`\`\`\n${error.digest}\n\`\`\`\nThis digest can be used to find the corresponding error in the server logs.`
      : 'This appears to be a client-side error.';

    return `
I've encountered an error in my Next.js (App Router) application. Please help me diagnose and fix it.

Here is the information captured by the \`error.tsx\` boundary:

**1. Error Message:**
\`\`\`
${error.message}
\`\`\`

**2. Error Stack Trace:**
\`\`\`
${error.stack || 'No stack trace available.'}
\`\`\`

**3. Context & Digest:**
${digestInfo}

Based on this information, what are the most likely causes? Please provide specific code changes for the fix.
    `;
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generateAIPrompt());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // =================================================================
  //  DEVELOPMENT-ONLY RENDER
  //  Provides maximum information to the developer.
  // =================================================================
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="container mx-auto max-w-4xl p-4 font-sans">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle className="text-xl font-bold">
            Application Error (Dev Mode)
          </AlertTitle>
          <AlertDescription>
            An error was caught. Use the details below to debug.
          </AlertDescription>
        </Alert>

        <div className="mt-4 rounded-md border bg-card p-4 text-card-foreground">
          <h2 className="mb-2 text-lg font-semibold text-destructive">
            {error.message}
          </h2>

          {error.digest && (
            <div className="mb-4">
              <span className="mr-2 rounded-full bg-yellow-200 px-3 py-1 text-xs font-semibold text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                <ServerCrash className="mr-1 inline-block h-3 w-3" />
                Server-Side Error
              </span>
              <span className="text-sm text-muted-foreground">
                Digest: {error.digest}
              </span>
            </div>
          )}

          {error.stack && (
            <details className="cursor-pointer rounded-md bg-muted p-3">
              <summary className="font-medium text-muted-foreground">
                View Stack Trace
              </summary>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap pt-2 text-sm">
                <code>{error.stack}</code>
              </pre>
            </details>
          )}
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold">AI Assistant Prompt</h2>
          <p className="text-sm text-muted-foreground">
            Copy this prompt and paste it into your AI agent to get help.
          </p>
          <div className="relative mt-2">
            <pre className="max-h-60 overflow-auto rounded-md bg-muted p-4 text-sm">
              <code>{generateAIPrompt()}</code>
            </pre>
            <Button
              size="sm"
              variant="secondary"
              className="absolute right-2 top-2"
              onClick={handleCopyPrompt}
            >
              <Copy className="mr-2 h-4 w-4" />
              {isCopied ? 'Copied!' : 'Copy Prompt'}
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-4">
          <Button onClick={reset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button asChild variant="outline">
            <Link href="/" className="flex items-center gap-2">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // =================================================================
  //  PRODUCTION / USER-FACING RENDER
  //  Clean, simple, and non-technical.
  // =================================================================
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <main className="max-w-lg rounded-xl border bg-card p-8 shadow-sm">
        <ServerCrash className="mx-auto mb-6 h-16 w-16 text-destructive" />
        <h1 className="mb-4 text-2xl font-bold text-card-foreground md:text-3xl">
          Oops! Something went wrong.
        </h1>
        <p className="mb-8 text-muted-foreground">
          We've encountered an unexpected issue. Our team has been notified, but
          you can try to refresh the page or return to the homepage.
        </p>
        {error.digest && (
          <p className="mb-6 text-xs text-muted-foreground/60 font-mono">
            Reference ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button onClick={() => reset()} size="lg">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/" className="flex items-center gap-2">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
