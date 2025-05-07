'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import React, { useEffect } from 'react';
import Link from 'next/link';

interface SearchInputProps {
  query: string;
  setQuery: (query: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isLoading: boolean;
  data: { blog: { slug: string; title: string }[]; tools: { id: string }[] } | undefined;
  searchHistory: string[];
  setSearchHistory: (history: string[]) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({
  query,
  setQuery,
  isSearchOpen,
  setIsSearchOpen,
  searchHistory,
  setSearchHistory,
  isLoading,
  data,
}) => {
  useEffect(() => {
    if (query.trim() !== '') {
      setSearchHistory([...new Set([query.trim(), ...searchHistory])].slice(0, 5)); // Limit to 5 items
    }
  }, [query, setSearchHistory]);

  return (
    <div className="relative hidden md:block search-container">
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsSearchOpen(true)}
        className="h-9 w-48 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
      <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
      {(query || isSearchOpen) && (
        <div className="absolute top-full mt-2 w-full rounded-md border bg-popover p-2 shadow-md max-h-[300px] overflow-y-auto">
          {!query && searchHistory.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 text-sm font-medium text-muted-foreground">
                Recent Searches
              </div>
              {searchHistory.map((item: string) => (
                <button
                  key={item}
                  className="block w-full text-left px-2 py-1 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setQuery(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
          {isLoading && (
            <div className="flex items-center justify-center py-2 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Searching...</span>
            </div>
          )}
          {!isLoading && data && (
            <div className="space-y-4">
              {data.blog && data.blog.length > 0 && (
                <div>
                  <div className="mb-2 text-sm font-medium text-muted-foreground">
                    Blog Posts
                  </div>
                  {data.blog.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/blog/${item.slug}`}
                      className={cn(
                        'block px-2 py-1 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground',
                      )}
                      onClick={() => {
                        setQuery('');
                        setIsSearchOpen(false);
                      }}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              )}
              {data.tools && data.tools.length > 0 && (
                <div>
                  <div className="mb-2 text-sm font-medium text-muted-foreground">
                    Tools
                  </div>
                  {data.tools.map((item) => (
                    <Link
                      key={item.id}
                      href={`#${item.id}`}
                      className={cn(
                        'block px-2 py-1 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground',
                      )}
                      onClick={() => {
                        setQuery('');
                        setIsSearchOpen(false);
                      }}
                    >
                      {item.id}
                    </Link>
                  ))}
                </div>
              )}
              {!data.blog?.length && !data.tools?.length && (
                <div className="text-sm text-muted-foreground text-center py-2">
                  No results found
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchInput;
