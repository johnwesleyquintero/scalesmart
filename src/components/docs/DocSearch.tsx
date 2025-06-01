'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { DocArticleMetadata } from '@/lib/docs-data/static-docs';

export default function DocSearch() {
  const [query, setQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<
    DocArticleMetadata[]
  >([]);
  const [allDocs, setAllDocs] = React.useState<DocArticleMetadata[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  // Fetch all documentation metadata for client-side search
  React.useEffect(() => {
    async function fetchAllDocsForSearch() {
      try {
        setLoading(true);
        const response = await fetch('/api/docs-menu');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: DocArticleMetadata[] = await response.json();
        setAllDocs(data);
      } catch (e: unknown) {
        // Change from 'any' to 'unknown'
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('An unknown error occurred.');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchAllDocsForSearch();
  }, []);

  React.useEffect(() => {
    if (query.length > 1) {
      const filtered = allDocs.filter(
        (doc) =>
          doc.title.toLowerCase().includes(query.toLowerCase()) ||
          doc.description.toLowerCase().includes(query.toLowerCase()) ||
          doc.category.toLowerCase().includes(query.toLowerCase()) ||
          (doc.tags &&
            doc.tags.some((tag) =>
              tag.toLowerCase().includes(query.toLowerCase()),
            )),
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [query, allDocs]);

  const handleSelectResult = (slug: string) => {
    router.push(`/docs/${slug}`);
    setQuery('');
    setSearchResults([]);
  };

  if (loading) return <div>Loading search index...</div>;
  if (error)
    return <div className="text-red-500">Error loading search: {error}</div>;

  return (
    <div className="relative w-full max-w-md mx-auto">
      <input
        type="text"
        placeholder="Search documentation..."
        className="w-full p-2 border rounded-md"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {query.length > 1 && searchResults.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
          {searchResults.map((result) => (
            <li
              key={result.slug}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelectResult(result.slug)}
            >
              <div className="font-semibold">{result.title}</div>
              <div className="text-sm text-gray-600">{result.description}</div>
            </li>
          ))}
        </ul>
      )}
      {query.length > 1 && searchResults.length === 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 p-4 text-gray-500">
          No results found.
        </div>
      )}
    </div>
  );
}
