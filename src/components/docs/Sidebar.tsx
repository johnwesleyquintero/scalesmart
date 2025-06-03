'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DocArticleMetadata } from '@/lib/docs-data/static-docs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// Custom hook for data fetching
function useDocsMetadata() {
  const [state, setState] = useState<{
    data: DocArticleMetadata[];
    loading: boolean;
    error: string | null;
  }>({
    data: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/docs-menu');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        setState({
          data: await response.json(),
          loading: false,
          error: null,
        });
      } catch (error) {
        setState({
          data: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    fetchData();
  }, []);

  return state;
}

// Utility function for grouping docs by category
function groupAndSortDocs(
  docs: DocArticleMetadata[],
): Record<string, DocArticleMetadata[]> {
  const grouped = docs.reduce<Record<string, DocArticleMetadata[]>>(
    (acc, doc) => {
      if (!acc[doc.category]) acc[doc.category] = [];
      acc[doc.category].push(doc);
      return acc;
    },
    {},
  );

  // Sort each category's documents by order
  for (const category in grouped) {
    grouped[category].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  return grouped;
}

// Re-using StatusMessage from DocSearch, but simplified for reusability.
// In a real application, you might define this in a shared utility component.
function StatusMessage({
  message,
  type = 'info',
}: {
  message: string;
  type?: 'info' | 'error';
}) {
  return (
    <div
      className={`p-4 text-center ${
        type === 'error' ? 'text-red-500' : 'text-gray-500'
      }`}
    >
      {message}
    </div>
  );
}

// UI Components
function DocLink({
  doc,
  isActive,
}: {
  doc: DocArticleMetadata;
  isActive: boolean;
}) {
  return (
    <li>
      <Link
        href={`/docs/${doc.slug}`}
        className={`relative block py-1.5 transition-colors duration-200 ${
          isActive
            ? 'text-blue-600 font-semibold before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-full before:w-[3px] before:bg-blue-600'
            : 'text-gray-700 hover:text-blue-600'
        }`}
      >
        {doc.title}
      </Link>
    </li>
  );
}

function SidebarSection({
  category,
  docs,
  currentPath,
}: {
  category: string;
  docs: DocArticleMetadata[];
  currentPath: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const shouldBeOpen = docs.some(
      (doc) =>
        currentPath === `/docs/${doc.slug}` ||
        (doc.slug === 'getting-started' && currentPath === '/docs'),
    );
    setIsOpen(shouldBeOpen);
  }, [currentPath, docs]);

  return (
    <Accordion
      type="single"
      collapsible
      value={isOpen ? category : ''}
      onValueChange={(value) => setIsOpen(value === category)}
      className="w-full"
    >
      <AccordionItem value={category} className="border-b-0">
        <AccordionTrigger className="font-bold text-lg capitalize py-2 hover:no-underline">
          {category.replace(/-/g, ' ')}
        </AccordionTrigger>
        <AccordionContent className="pb-0">
          <ul className="space-y-1 pl-4 border-l">
            {docs.map((doc) => (
              <DocLink
                key={doc.slug}
                doc={doc}
                isActive={
                  currentPath === `/docs/${doc.slug}` ||
                  (doc.slug === 'getting-started' && currentPath === '/docs')
                }
              />
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

// Main Component
export default function DocsSidebar() {
  const pathname = usePathname();
  const { data, loading, error } = useDocsMetadata();

  const categorizedDocs = useMemo(() => {
    if (loading || error || !data.length) return {};
    return groupAndSortDocs(data);
  }, [data, loading, error]);

  if (loading) return <StatusMessage message="Loading sidebar..." />;
  if (error) return <StatusMessage message={`Error: ${error}`} type="error" />;
  if (!data.length) return <StatusMessage message="No documentation found." />;

  return (
    <nav className="space-y-2">
      {Object.keys(categorizedDocs)
        .sort()
        .map((category) => (
          <SidebarSection
            key={category}
            category={category}
            docs={categorizedDocs[category]}
            currentPath={pathname}
          />
        ))}
    </nav>
  );
}
