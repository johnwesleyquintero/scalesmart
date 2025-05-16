'use client';

import MdxRenderer from '@/components/MdxRenderer';
import { useEffect, useState } from 'react';

const ErrorGuide = () => {
  const [mdxContent, setMdxContent] = useState('');

  useEffect(() => {
    const fetchMdxContent = async () => {
      const response = await fetch('/error-guide');
      const content = await response.text();
      setMdxContent(content);
    };

    fetchMdxContent();
  }, []);

  return <div>{mdxContent && <MdxRenderer content={mdxContent} />}</div>;
};

export default ErrorGuide;
