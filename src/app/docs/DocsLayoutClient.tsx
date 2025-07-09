'use client';

import React, { useState } from 'react';
import DocSearch from './components/DocSearch';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import TableOfContents from './components/TableOfContents'; // Import TableOfContents
import { useDocsHeadings } from './components/DocsHeadingsContext'; // Import useDocsHeadings

interface DocsLayoutClientProps {
  children: React.ReactNode;
}

export default function DocsLayoutClient({ children }: DocsLayoutClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { headings } = useDocsHeadings(); // Consume headings from context, still needed for TableOfContents

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      {/* Hamburger menu for mobile */}
      <Button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50"
        aria-label="Toggle documentation navigation"
        size="icon"
        variant="outline"
      >
        {isSidebarOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>
      {children}
      {/* Table of Contents Area - Fixed on desktop, hidden on mobile */}
      <aside
        className="sticky top-14 z-30 hidden h-[calc(100vh-3.5rem)] shrink-0 lg:block overflow-y-auto"
        aria-label="On-page navigation"
      >
        <div className="relative h-full py-6 pl-6 lg:py-8">
          <TableOfContents headings={headings} /> {/* Render TableOfContents */}
        </div>
      </aside>
    </>
  );
}
