import React from 'react';
import Link from 'next/link';
import DocsSidebar from '../../components/docs/Sidebar';
import DocSearch from '../../components/docs/DocSearch';
import { ErrorBoundary } from '@/components/error-boundary';

interface DocsLayoutProps {
  children: React.ReactNode;
}

/**
 * Main documentation layout component
 * - Handles the responsive sidebar + main content layout
 * - Includes search functionality
 * - Manages consistent spacing and styling
 */
export default function DocsLayout({ children }: DocsLayoutProps) {
  // Memoize the sidebar to prevent unnecessary re-renders
  const memoizedSidebar = React.useMemo(
    () => (
      <ErrorBoundary fallback={<SidebarErrorFallback />}>
        <DocsSidebar />
      </ErrorBoundary>
    ),
    [],
  );

  return (
    <div className="docs-layout container flex flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 pt-10">
      {/* Sidebar Area - Fixed on desktop, hidden on mobile */}
      <aside
        className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block"
        aria-label="Documentation navigation"
      >
        <div className="relative overflow-hidden h-full py-6 pr-6 lg:py-8">
          {/* Search Component */}
          <div className="mb-6 px-2">
            <DocSearch />
          </div>

          {/* Navigation Sidebar with error boundary */}
          {memoizedSidebar}
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        className="relative py-6 lg:py-8 w-full"
        id="main-content"
        tabIndex={-1} // For better keyboard navigation
      >
        {children}
      </main>
    </div>
  );
}

// Fallback component for sidebar errors
function SidebarErrorFallback() {
  return (
    <div className="p-4 text-red-500 border border-red-200 rounded">
      Failed to load navigation. Please refresh the page.
    </div>
  );
}
