'use client';

import React, {
  useMemo,
  useState,
  useEffect,
  useTransition,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import { DocArticleMetadata } from '@/lib/docs-data/static-docs';
import useDebounceCallback from '@/hooks/use-debounce-callback';

// Utility function for fuzzy matching (simple implementation for demonstration)
function fuzzyMatch(text: string, query: string): number {
  if (!query) return 1; // Empty query matches everything perfectly
  text = text.toLowerCase();
  query = query.toLowerCase();

  let score = 0;
  let queryIndex = 0;
  for (let i = 0; i < text.length; i++) {
    if (queryIndex < query.length && text[i] === query[queryIndex]) {
      score++;
      queryIndex++;
    }
  }

  if (queryIndex === query.length) {
    // If all query characters are found,
    // give higher score for exact matches and shorter texts
    return score / text.length + score / query.length;
  }
  return 0; // No match
}

// Custom hook for search logic
function useDocSearch() {
  const [allDocs, setAllDocs] = useState<DocArticleMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all docs once on mount
  useEffect(() => {
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

  const searchFunction = useCallback(
    (queryParam: string | undefined | null) => {
      const currentQuery = queryParam?.trim() || '';
      if (currentQuery.length < 2) return [];

      const resultsWithScores = allDocs
        .map((doc) => {
          const titleMatch = fuzzyMatch(doc.title, currentQuery);
          const descriptionMatch = fuzzyMatch(doc.description, currentQuery);
          const categoryMatch = fuzzyMatch(doc.category, currentQuery);
          const tagsMatch =
            doc.tags?.some((tag) => fuzzyMatch(tag, currentQuery)) || false;

          const score =
            titleMatch * 3 + // Higher weight for title matches
            descriptionMatch * 1.5 + // Medium weight for description
            categoryMatch * 2 + // Medium weight for category
            (tagsMatch ? 1 : 0); // Lower weight for tag match

          return { doc, score };
        })
        .filter((item) => item.score > 0) // Only include relevant results
        .sort((a, b) => b.score - a.score) // Sort by score descending
        .map((item) => item.doc); // Return original doc objects

      return resultsWithScores;
    },
    [allDocs],
  );

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
  const debouncedOnChange = useDebounceCallback(onChange, 300);

  useEffect(() => {
    if (externalValue !== internalValue) {
      setInternalValue(externalValue);
    }
  }, [externalValue, internalValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    startTransition(() => {
      debouncedOnChange(newValue);
    });
  };

  return (
    <input
      type="text"
      placeholder={`Search documentation... ${isPending ? '⌛' : ''}`}
      className="w-full p-2 border rounded-md"
      value={internalValue}
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

  const queryToSearch = query || '';

  const results = useMemo(() => {
    if (loading || error) return [];
    return searchFunction(queryToSearch);
  }, [queryToSearch, searchFunction, loading, error]);

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
          <StatusMessage message="No results found." />
        ))}
    </div>
  );
}
