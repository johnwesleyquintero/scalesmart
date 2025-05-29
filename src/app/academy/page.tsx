import DashboardHeader from './components/DashboardHeader';
import ErrorBoundary from '@/components/ui/error-boundary';
import { Suspense } from 'react'; // Import Suspense
import { AcademyPageContent } from './components/AcademyPageContent'; // Import the new component

export default function AcademyPage() {
  return (
    <div className="container max-w-7xl mx-auto px-4 pt-8 pb-6 md:pt-12 md:pb-8">
      <ErrorBoundary>
        <DashboardHeader description="Master Amazon PPC, SEO, and sales strategies with our comprehensive courses" />
        <Suspense
          fallback={
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-pulse flex flex-col gap-4 w-full max-w-2xl">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          }
        >
          <div className="w-full">
            <AcademyPageContent />
          </div>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
