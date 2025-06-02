'use client';

import React, { useMemo, useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DocArticleMetadata } from '@/lib/docs-data/static-docs';
import useDebounceCallback from '@/hooks/use-debounce-callback'; // Correct import

// Custom hook for search logic
function useDocSearch() {
  const [allDocs, setAllDocs] = useState<DocArticleMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all docs once on mount
  React.useEffect(() => {
    const fetchAllDocs = async () => {
      try {
        const response = await fetch('/api/docs-menu');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        setAllDocs(await response.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchAllDocs();
  }, []);

  // Memoized search function with useCallback, handling potential undefined query
  const searchFunction = React.useCallback(
    (queryParam: string | undefined | null) => {
      const currentQuery = queryParam || ''; // Ensure query is always a string
      if (currentQuery.length < 2) return [];

      const q = currentQuery.toLowerCase();
      return allDocs.filter(
        (doc) =>
          doc.title.toLowerCase().includes(q) ||
          doc.description.toLowerCase().includes(q) ||
          doc.category.toLowerCase().includes(q) ||
          doc.tags?.some((tag) => tag.toLowerCase().includes(q)),
      );
    },
    [allDocs],
  ); // Dependency on allDocs

  // Export searchFunction as search
  return { allDocs, loading, error, search: searchFunction };
}

// UI Components
const SearchInput = ({
  value: externalValue,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const [internalValue, setInternalValue] = useState(externalValue);
  const [isPending, startTransition] = useTransition();
  const debouncedOnChange = useDebounceCallback(onChange, 300); // Use the new hook

  // Sync internal state with external prop value
  // This is crucial for keeping the internal input value up-to-date when the external `query` changes
  // for example, when the search is cleared (`setQuery('')`).
  useEffect(() => {
    if (externalValue !== internalValue) {
      setInternalValue(externalValue);
    }
  }, [externalValue, internalValue]); // Added internalValue to dependencies for useEffect, important for controlling re-renders of the input field

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue); // Update internal state immediately for smooth UX
    startTransition(() => {
      debouncedOnChange(newValue); // Debounce the external state update
    });
  };

  return (
    <input
      type="text"
      placeholder={`Search documentation... ${isPending ? '⌛' : ''}`}
      className="w-full p-2 border rounded-md"
      value={internalValue} // Input is controlled by internal state
      onChange={handleChange}
    />
  );
};

const ResultsList = ({
  results,
  onSelect,
}: {
  results: DocArticleMetadata[];
  onSelect: (slug: string) => void;
}) => (
  <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
    {results.map((result) => (
      <li
        key={result.slug}
        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
        onClick={() => onSelect(result.slug)}
      >
        <div className="font-semibold">{result.title}</div>
        <div className="text-sm text-gray-600">{result.description}</div>
      </li>
    ))}
  </ul>
);

const StatusMessage = ({
  message,
  type = 'info',
}: {
  message: string;
  type?: 'info' | 'error';
}) => (
  <div
    className={`p-4 text-center ${
      type === 'error' ? 'text-red-500' : 'text-gray-500'
    }`}
  >
    {message}
  </div>
);

// Main Component
export default function DocSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { loading, error, search: searchFunction } = useDocSearch();

  const queryToSearch = query || ''; // Ensure query is always a string for safe length access

  // Memoized results to prevent unnecessary re-renders, only if not loading
  const results = useMemo(() => {
    if (loading || error) return []; // Don't try to search if still loading or has an error
    return searchFunction(queryToSearch);
  }, [queryToSearch, searchFunction, loading, error]); // Add queryToSearch to dependencies, remove query

  const handleSelectResult = (slug: string) => {
    router.push(`/docs/${slug}`);
    setQuery('');
  };

  if (loading) return <StatusMessage message="Loading search index..." />;
  if (error) return <StatusMessage message={`Error: ${error}`} type="error" />;

  return (
    <div className="relative w-full max-w-md mx-auto">
      <SearchInput value={query} onChange={setQuery} />

      {queryToSearch.length > 1 &&
        (results.length > 0 ? (
          <ResultsList results={results} onSelect={handleSelectResult} />
        ) : (
          <StatusMessage message="No results found" />
        ))}
    </div>
  );
}
