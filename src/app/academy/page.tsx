import DashboardHeader from './components/DashboardHeader';
import ErrorBoundary from '@/components/ui/error-boundary';
import { AcademyPageContent } from './components/AcademyPageContent';

export default function AcademyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container max-w-7xl mx-auto px-4 pt-8 pb-6 md:pt-12 md:pb-8">
        <ErrorBoundary>
          <DashboardHeader description="Master Amazon PPC, SEO, and sales strategies with our comprehensive courses" />
          <div className="w-full">
            <AcademyPageContent />
          </div>
        </ErrorBoundary>
      </div>
    </div>
  );
}
