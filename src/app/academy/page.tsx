import SchoolComponent from './components/SchoolComponent';
import ErrorBoundary from '@/components/error-boundary';

export default function AcademyPage() {
  return (
    <ErrorBoundary>
      <SchoolComponent />
    </ErrorBoundary>
  );
}
