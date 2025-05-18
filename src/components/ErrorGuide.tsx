'use client';

import MdxRenderer from '@/components/MdxRenderer';
import { useEffect, useState } from 'react';
import { cachedFetch } from '@/lib/api-cache';

const ErrorGuide = () => {
  const [mdxContent, setMdxContent] = useState('');

  useEffect(() => {
    const fetchMdxContent = async () => {
      const response = await cachedFetch('/error-guide');
      const content = await response.text();
      setMdxContent(content);
    };

    fetchMdxContent();
  }, []);

  return <div>{mdxContent && <MdxRenderer content={mdxContent} />}</div>;
};

export default ErrorGuide;

// Rollback strategy: To revert to the previous version, simply remove the cachedFetch import
// and replace cachedFetch with fetch.
