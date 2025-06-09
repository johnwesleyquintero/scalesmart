'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { useMarkdownNotepadContext } from '@/context/MarkdownNotepadContext';

const SearchBar = () => {
  const { searchQuery, setSearchQuery } = useMarkdownNotepadContext();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  return (
    <div className="flex items-center space-x-2 w-full">
      <label htmlFor="search" className="sr-only">
        Search notes:
      </label>
      <Input
        type="text"
        id="search"
        value={searchQuery}
        onChange={handleChange}
        placeholder="Search notes..."
        className="flex-grow"
      />
    </div>
  );
};

export default SearchBar;
