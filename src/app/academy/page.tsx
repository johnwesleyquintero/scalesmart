import SchoolComponent from './SchoolComponent';
import ErrorBoundary from '@/components/error-boundary';

export default async function AcademyPage() {
  const baseUrl =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://wescode.vercel.app';
  try {
    const res = await fetch(`${baseUrl}/api/academy-courses`);
    const academyData = await res.json();
    return (
      <ErrorBoundary>
        <SchoolComponent academyData={academyData} />
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('Failed to fetch academy data:', error);
    // Log to error tracking service (e.g., Sentry, Bugsnag)
    // Sentry.captureException(error);
    return <div>Error loading academy data. Please try again later.</div>;
  }
}
