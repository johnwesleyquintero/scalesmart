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
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold text-red-600">
          Oops! Something went wrong.
        </h2>
        <p className="text-gray-700 mt-2">
          We couldn't load the academy content. Please try refreshing the page.
        </p>
        <p className="text-gray-500 text-sm mt-1">
          If the problem persists, please contact support.
        </p>
      </div>
    );
  }
}
