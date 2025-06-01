'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DocArticleMetadata } from '@/lib/docs-data/static-docs';

interface DocsSidebarProps {
  // No external props needed as data is fetched internally
}

export default function DocsSidebar() {
  const pathname = usePathname();
  const [docsMetadata, setDocsMetadata] = React.useState<DocArticleMetadata[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Group documents by category
  const categorizedDocs = React.useMemo(() => {
    const categories: { [key: string]: DocArticleMetadata[] } = {};
    docsMetadata.forEach((doc) => {
      if (!categories[doc.category]) {
        categories[doc.category] = [];
      }
      categories[doc.category].push(doc);
    });
    // Sort categories alphabetically
    return Object.keys(categories).sort().reduce(
      (obj, key) => { 
        obj[key] = categories[key];
        // Sort articles within each category by order
        obj[key].sort((a, b) => (a.order || 0) - (b.order || 0));
        return obj;
      }, 
      {} as { [key: string]: DocArticleMetadata[] }
    );
  }, [docsMetadata]);

  React.useEffect(() => {
    async function fetchDocsMenu() {
      try {
        setLoading(true);
        const response = await fetch('/api/docs-menu');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: DocArticleMetadata[] = await response.json();
        setDocsMetadata(data);
      } catch (e: unknown) { // Change from 'any' to 'unknown'
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('An unknown error occurred.');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchDocsMenu();
  }, []);

  if (loading) return <div>Loading sidebar...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (docsMetadata.length === 0) return <div>No documentation found.</div>;

  return (
    <nav className="space-y-2">
      {Object.entries(categorizedDocs).map(([category, docs]) => (
        <div key={category} className="mb-4">
          <h3 className="font-bold text-lg mb-2 capitalize">{category}</h3>
          <ul className="space-y-1">
            {docs.map((doc) => (
              <li key={doc.slug}>
                <Link
                  href={`/docs/${doc.slug}`}
                  className={`block px-3 py-2 rounded-md ${
                    pathname === `/docs/${doc.slug}` || (doc.slug === 'getting-started' && pathname === '/docs')
                      ? 'bg-blue-100 text-blue-800 font-semibold'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {doc.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}