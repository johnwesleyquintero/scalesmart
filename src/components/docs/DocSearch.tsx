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
import Fuse from 'fuse.js'; // Import Fuse.js

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

  // Initialize Fuse.js
  const fuse = useMemo(() => {
    return new Fuse(allDocs, {
      keys: [
        { name: 'title', weight: 0.7 },
        { name: 'description', weight: 0.4 },
        { name: 'category', weight: 0.3 },
        { name: 'tags', weight: 0.2 },
        { name: 'content', weight: 0.8 }, // Higher weight for content matches
      ],
      includeScore: true,
      threshold: 0.3, // Adjust as needed for fuzziness
      ignoreLocation: true, // Search anywhere in the string
    });
  }, [allDocs]);

  const searchFunction = useCallback(
    (queryParam: string | undefined | null) => {
      const currentQuery = queryParam?.trim();
      if (!currentQuery || currentQuery.length < 2) return [];

      const results = fuse.search(currentQuery).map((result) => result.item);
      return results;
    },
    [fuse],
  );

  return { allDocs, loading, error, search: searchFunction };
}

// UI Components
const SearchInput = ({
  value: externalValue,
  onChange,
  onFocus,
  onKeyDown,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
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
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      value={internalValue}
      onChange={handleChange}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      ref={inputRef}
    />
  );
};

const ResultsList = ({
  results,
  onSelect,
  selectedIndex,
  resultsListRef,
}: {
  results: DocArticleMetadata[];
  onSelect: (slug: string) => void;
  selectedIndex: number;
  resultsListRef: React.RefObject<HTMLUListElement | null>;
}) => (
  <ul
    className="absolute z-10 w-full bg-popover border border-border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto"
    ref={resultsListRef}
  >
    {results.map((result, index) => (
      <li
        key={result.slug}
        className={`px-4 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer ${
          index === selectedIndex ? 'bg-accent text-accent-foreground' : ''
        }`}
        onClick={() => onSelect(result.slug)}
      >
        <div className="font-semibold text-foreground">{result.title}</div>
        <div className="text-sm text-muted-foreground">
          {result.description}
        </div>
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
      type === 'error' ? 'text-destructive' : 'text-muted-foreground'
    }`}
  >
    {message}
  </div>
);

// Main Component
export default function DocSearch() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const resultsListRef = React.useRef<HTMLUListElement>(null);

  const handleOutsideClick = useCallback(
    (event: MouseEvent) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node) &&
        resultsListRef.current &&
        !resultsListRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
      }
    },
    [searchInputRef, resultsListRef],
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [handleOutsideClick]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((prevIndex) =>
        Math.min(prevIndex + 1, results.length - 1),
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((prevIndex) => Math.max(prevIndex - 1, -1));
    } else if (event.key === 'Enter' && selectedIndex !== -1) {
      event.preventDefault();
      handleSelectResult(results[selectedIndex].slug);
    }
  };

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
    setIsDropdownOpen(false);
    setSelectedIndex(-1);
  };

  return (
    <div className="relative w-full">
      <SearchInput
        value={query}
        onChange={setQuery}
        onFocus={() => setIsDropdownOpen(true)}
        onKeyDown={handleKeyDown}
        inputRef={searchInputRef}
      />

      {queryToSearch.length > 1 &&
        isDropdownOpen &&
        (results.length > 0 ? (
          <ResultsList
            results={results}
            onSelect={handleSelectResult}
            selectedIndex={selectedIndex}
            resultsListRef={resultsListRef}
          />
        ) : (
          <StatusMessage message="No results found." />
        ))}
    </div>
  );
}
