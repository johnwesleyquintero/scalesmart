import DashboardHeader from './components/DashboardHeader';
import ErrorBoundary from '@/components/ui/error-boundary'; // Assuming this path is correct
import { AcademyPageContent } from './components/AcademyPageContent';
import type { Metadata } from 'next'; // Import Metadata type

// Define metadata for the Academy page
export const metadata: Metadata = {
  alternates: {
    canonical: 'https://wescode.vercel.app/academy',
  },
};

/**
 * The main page component for the Academy section.
 * Renders the header and content within an error boundary and layout container.
 */
export default function AcademyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 pt-8 pb-6 md:pt-12 md:pb-8">
        <ErrorBoundary>
          <DashboardHeader description="Master Amazon PPC, SEO, and sales strategies with our comprehensive courses" />
          {/* Removed potentially redundant w-full div around content */}
          <AcademyPageContent />
        </ErrorBoundary>
      </div>
    </div>
  );
}
