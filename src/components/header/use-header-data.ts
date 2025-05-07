import { useEffect, useState } from 'react';

interface UseHeaderDataResult {
  // Defines the structure of the return value of the useHeaderData hook
  query: string; // The current search query
  setQuery: (query: string) => void; // Function to set the search query
  debouncedQuery: string;
  isSearchOpen: boolean;
  setIsSearchOpen: (isSearchOpen: boolean) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (isMenuOpen: boolean) => void;
  searchHistory: string[];
  setSearchHistory: (searchHistory: string[]) => void;
}

export const useHeaderData = (): UseHeaderDataResult => {
  // Manages the state for the header component
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    // Debounces the search query
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  useEffect(() => {
    // Handles clicks outside the search container
    const handleClickOutside = (e: MouseEvent) => {
      const searchContainer = document.querySelector('.search-container');
      if (searchContainer && !searchContainer.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Handles keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return {
    query,
    setQuery,
    debouncedQuery,
    isSearchOpen,
    setIsSearchOpen,
    isMenuOpen,
    setIsMenuOpen,
    searchHistory,
    setSearchHistory,
  };
};
