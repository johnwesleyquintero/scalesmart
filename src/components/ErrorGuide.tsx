'use client';

import MdxRenderer from '@/components/MdxRenderer';
import { useEffect, useState } from 'react';
import { cachedFetch } from '@/lib/api-cache';

const ErrorGuide = () => {
  const [mdxContent, setMdxContent] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);

  useEffect(() => {
    const fetchMdxContent = async () => {
      const response = await cachedFetch('/error-guide');
      const data = await response.json(); // Assuming the API returns JSON with content and keywords
      setMdxContent(data.content);
      setKeywords(data.keywords || []);
    };

    fetchMdxContent();
  }, []);

  return (
    <div>
      {mdxContent && <MdxRenderer content={mdxContent} keywords={keywords} />}
    </div>
  );
};

export default ErrorGuide;
