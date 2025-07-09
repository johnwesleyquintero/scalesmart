'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Heading } from '@/lib/docs-data/get-headings';

interface DocsHeadingsContextType {
  headings: Heading[];
  setHeadings: (headings: Heading[]) => void;
}

const DocsHeadingsContext = createContext<DocsHeadingsContextType | undefined>(
  undefined,
);

export const DocsHeadingsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [headings, setHeadings] = useState<Heading[]>([]);

  return (
    <DocsHeadingsContext.Provider value={{ headings, setHeadings }}>
      {children}
    </DocsHeadingsContext.Provider>
  );
};

export const useDocsHeadings = () => {
  const context = useContext(DocsHeadingsContext);
  if (context === undefined) {
    throw new Error(
      'useDocsHeadings must be used within a DocsHeadingsProvider',
    );
  }
  return context;
};
