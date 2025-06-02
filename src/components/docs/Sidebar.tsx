'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DocArticleMetadata } from '@/lib/docs-data/static-docs';

// Custom hook for data fetching
function useDocsMetadata() {
  const [state, setState] = React.useState<{
    data: DocArticleMetadata[];
    loading: boolean;
    error: string | null;
  }>({
    data: [],
    loading: true,
    error: null,
  });

  React.useEffect(() => {
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
function groupAndSortDocs(docs: DocArticleMetadata[]) {
  return docs.reduce<Record<string, DocArticleMetadata[]>>((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = [];
    acc[doc.category].push(doc);
    return acc;
  }, {});
}

// UI Components
function SidebarSection({
  category,
  docs,
  currentPath,
}: {
  category: string;
  docs: DocArticleMetadata[];
  currentPath: string;
}) {
  return (
    <div className="mb-4">
      <h3 className="font-bold text-lg mb-2 capitalize">{category}</h3>
      <ul className="space-y-1">
        {docs
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((doc) => (
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
        className={`block px-3 py-2 rounded-md transition-colors ${
          isActive
            ? 'bg-blue-100 text-blue-800 font-semibold'
            : 'hover:bg-gray-100 text-gray-800'
        }`}
      >
        {doc.title}
      </Link>
    </li>
  );
}

// Main Component
export default function DocsSidebar() {
  const pathname = usePathname();
  const { data, loading, error } = useDocsMetadata();

  // Memoize the grouped docs to prevent unnecessary recalculations
  const categorizedDocs = React.useMemo(() => {
    if (!data.length) return {};
    const grouped = groupAndSortDocs(data);

    // Sort categories alphabetically
    return Object.keys(grouped)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = grouped[key];
          return acc;
        },
        {} as Record<string, DocArticleMetadata[]>,
      );
  }, [data]);

  // Loading and error states
  if (loading)
    return <div className="p-4 text-gray-500">Loading sidebar...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!data.length)
    return <div className="p-4 text-gray-500">No documentation found.</div>;

  return (
    <nav className="space-y-2">
      {Object.entries(categorizedDocs).map(([category, docs]) => (
        <SidebarSection
          key={category}
          category={category}
          docs={docs}
          currentPath={pathname}
        />
      ))}
    </nav>
  );
}
