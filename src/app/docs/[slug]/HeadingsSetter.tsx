'use client';

import { useEffect } from 'react';
import { useDocsHeadings } from '../components/DocsHeadingsContext';
import { Heading } from '@/lib/docs-data/get-headings';

interface HeadingsSetterProps {
  headings: Heading[];
}

export function HeadingsSetter({ headings }: HeadingsSetterProps) {
  const { setHeadings } = useDocsHeadings();

  useEffect(() => {
    setHeadings(headings);
    return () => setHeadings([]); // Clear headings on unmount
  }, [headings, setHeadings]);

  return null; // This component doesn't render anything visible
}
