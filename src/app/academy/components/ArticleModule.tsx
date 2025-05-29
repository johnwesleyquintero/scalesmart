'use client';

import React, { useState, useEffect } from 'react';
import MdxRenderer from '../../../components/MdxRenderer';

interface ArticleModuleProps {
  contentSlug: string;
}

const ArticleModule: React.FC<ArticleModuleProps> = ({ contentSlug }) => {
  const [content, setContent] = useState<string | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/academy-article/${contentSlug}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setContent(data.content);
        setKeywords(data.keywords || []); // Set keywords
      } catch (error) {
        console.error('Could not fetch content:', error);
        setContent(null);
        setKeywords([]); // Reset keywords on error
      }
    };

    fetchContent();
  }, [contentSlug]);

  return (
    <div>
      <h2>Article</h2>
      {content ? (
        <MdxRenderer content={content} keywords={keywords} />
      ) : (
        <p>Loading article content...</p>
      )}
    </div>
  );
};

export default ArticleModule;
