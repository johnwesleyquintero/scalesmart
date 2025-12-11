'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DocArticleMetadata } from '@/lib/docs-data/static-docs';
import { GETTING_STARTED_SLUG } from '@/config/docs'; // Import the new constant
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

  for (const category in grouped) {
    grouped[category].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  return grouped;
}

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
            ? 'text-primary font-semibold before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-full before:w-[4px] before:bg-primary'
            : 'text-muted-foreground hover:text-foreground'
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
        (doc.slug === GETTING_STARTED_SLUG && currentPath === '/docs'),
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
          <ul className="space-y-1 pl-4 border-l border-border">
            {docs.map((doc) => (
              <DocLink
                key={doc.slug}
                doc={doc}
                isActive={
                  currentPath === `/docs/${doc.slug}` ||
                  (doc.slug === GETTING_STARTED_SLUG && currentPath === '/docs')
                }
              />
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

const DOC_CATEGORY_ORDER = [
  GETTING_STARTED_SLUG, // Use the constant
  'introduction',
  'api',
  'data-storage',
  'architecture',
  'error-guide',
  'hooks',
  'utils',
  'implementation',
  'strategies',
  'blog',
  

  'admin',
  
  'privacy-policy',
  'metadata',
  'page',
  'scripts',
  'sitemap',
  'layout',
  'loading',
  'not-found',
];

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
    <nav className="space-y-2 overflow-y-auto pr-2 pb-8">
      {Object.keys(categorizedDocs)
        .sort((a, b) => {
          const indexA = DOC_CATEGORY_ORDER.indexOf(a);
          const indexB = DOC_CATEGORY_ORDER.indexOf(b);

          if (indexA === -1 && indexB === -1) {
            return a.localeCompare(b);
          }
          if (indexA === -1) {
            return 1;
          }
          if (indexB === -1) {
            return -1;
          }
          return indexA - indexB;
        })
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
