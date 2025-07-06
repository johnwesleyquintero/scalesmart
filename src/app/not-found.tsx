import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Head from 'next/head'; // Added for SEO

export default function NotFound() {
  return (
    <div className="not-found-page flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <Head>
        <title>404 - Page Not Found</title>
      </Head>
      <div className="container flex flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="mb-4 text-9xl font-extrabold text-primary">404</h1>
        <h2 className="mb-8 text-2xl font-bold md:text-3xl">Page Not Found</h2>
        <p className="mb-8 max-w-md text-muted-foreground">
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>
        <Button asChild size="lg">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" /> {/*Slightly larger icon*/}
            Return to Homepage
          </Link>
        </Button>
      </div>
    </div>
  );
}
