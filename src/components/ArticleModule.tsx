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
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setContent(data.content);
      } catch (error) {
        console.error('Could not fetch content:', error);
        setContent(null);
      }
    };

    fetchContent();
  }, [contentSlug]);

  return (
    <div>
      <h2>Article</h2>
      {content ? (
        <MdxRenderer content={content} />
      ) : (
        <p>Loading article content...</p>
      )}
    </div>
  );
};

export default ArticleModule;
