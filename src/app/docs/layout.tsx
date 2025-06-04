import React from 'react';
import Link from 'next/link';
import DocsSidebar from '../../components/docs/Sidebar';
import { ErrorBoundary } from '@/components/error-boundary';
import DocsLayoutClient from './DocsLayoutClient';
import { Breadcrumbs } from '@/components/docs/Breadcrumbs';

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
    <div className="docs-layout container grid flex-1 items-start md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 pt-10">
      <DocsLayoutClient>
        {/* Sidebar Area - Fixed on desktop, hidden on mobile */}
        <aside
          className="sticky top-14 z-30 hidden h-[calc(100vh-3.5rem)] shrink-0 md:block"
          aria-label="Documentation navigation"
        >
          <div className="relative h-full py-6 pr-6 lg:py-8">
            {/* Navigation Sidebar with error boundary */}
            {memoizedSidebar}
          </div>
        </aside>

        {/* Main Content Area */}
        <main
          className="relative py-6 lg:py-8 w-full min-w-0"
          id="main-content"
          tabIndex={-1} // For better keyboard navigation
        >
          <div className="mb-8">
            <Breadcrumbs />
          </div>
          {children}
        </main>
      </DocsLayoutClient>
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
