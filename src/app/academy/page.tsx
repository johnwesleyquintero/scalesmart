import DashboardHeader from './components/DashboardHeader';
import ErrorBoundary from '@/components/ui/error-boundary';
import { Suspense } from 'react'; // Import Suspense
import { AcademyPageContent } from './components/AcademyPageContent'; // Import the new component

export default function AcademyPage() {
  return (
    <div className="container mx-auto px-4 pt-12 pb-8 md:pt-16 md:pb-12">
      <ErrorBoundary>
        <DashboardHeader
          title="WesAcademy"
          description="Master Amazon PPC, SEO, and sales strategies with our comprehensive courses"
        />
        <Suspense fallback={<div>Loading academy content...</div>}>
          <AcademyPageContent />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
