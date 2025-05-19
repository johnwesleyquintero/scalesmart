'use client';

import React, { useState, useEffect } from 'react';
import MdxRenderer from './MdxRenderer';

interface ArticleModuleProps {
  contentSlug: string;
}

const ArticleModule: React.FC<ArticleModuleProps> = ({ contentSlug }) => {
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/academy-article/${contentSlug}`);
        const data = await response.json();
        if (data.content) {
          setContent(data.content);
        } else {
          console.error('Error fetching article:', data.error);
          setContent(null);
        }
      } catch (error) {
        console.error('Error fetching article:', error);
        setContent(null);
      }
    };

    fetchContent();
  }, [contentSlug]);

  return content ? <MdxRenderer content={content} /> : <p>Loading article...</p>;
};

export default ArticleModule;
