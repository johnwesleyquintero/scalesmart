import React from 'react';
import Link from 'next/link';
import DocsSidebar from '../../components/docs/Sidebar';
import DocSearch from '../../components/docs/DocSearch';

interface DocsLayoutProps {
  children: React.ReactNode;
}

export default function DocsLayout({ children }: DocsLayoutProps) {
  return (
    <div className="container flex flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 pt-10">
      <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
        <div className="relative overflow-hidden h-full py-6 pr-6 lg:py-8">
          {/* Added for search bar, placed within the fixed sidebar */}
          <div className="mb-6">
            <DocSearch />
          </div>
          <DocsSidebar /> {/* Sidebar for navigation */}
        </div>
      </aside>
      {/* Main content area */}
      <main className="relative py-6 lg:py-8">{children}</main>
    </div>
  );
}
