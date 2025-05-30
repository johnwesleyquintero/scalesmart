'use client';

import React, { useState, useEffect } from 'react';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { components as MdxComponents } from '../../../components/MdxRenderer';

interface ArticleModuleProps {
  contentSlug: string;
}

const ArticleModule: React.FC<ArticleModuleProps> = ({ contentSlug }) => {
  const [mdxSource, setMdxSource] = useState<MDXRemoteSerializeResult | null>(
    null,
  );
  interface Frontmatter {
    title?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any; // Allow for other arbitrary frontmatter properties
  }
  const [frontmatter, setFrontmatter] = useState<Frontmatter>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMdxContent = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/academy/academy-article/${contentSlug}`,
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setMdxSource(data.source);
        setFrontmatter(data.frontmatter || {});
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An unknown error occurred.';
        console.error('Could not fetch MDX content:', err);
        setError(errorMessage || 'Failed to load article content.');
      } finally {
        setLoading(false);
      }
    };

    fetchMdxContent();
  }, [contentSlug]);

  if (loading) {
    return <p>Loading article content...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  if (!mdxSource) {
    return <p>No article content available.</p>;
  }

  return (
    <div>
      {frontmatter.title && (
        <h2 className="text-gray-900 dark:text-gray-100">
          {frontmatter.title}
        </h2>
      )}
      <div className="prose dark:prose-invert">
        <MDXRemote {...mdxSource} components={MdxComponents} />
      </div>
    </div>
  );
};

export default ArticleModule;
