'use client';

import React, { useCallback } from 'react';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { components as components } from '@/components/MdxRenderer'; // Adjusted path
import {
  useQuery,
  QueryKey,
  QueryFunctionContext,
} from '@tanstack/react-query'; // Import QueryKey

interface ArticleModuleProps {
  contentSlug: string;
}

interface ArticleData {
  source: MDXRemoteSerializeResult;
  frontmatter: {
    title?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any; // Allow for other arbitrary frontmatter properties
  };
}

const ArticleModule: React.FC<ArticleModuleProps> = ({ contentSlug }) => {
  // Use QueryKey for the parameter and assert type internally
  const fetchArticleContent = useCallback(
    async ({ queryKey }: QueryFunctionContext<QueryKey>) => {
      // Assert the type of queryKey to be a string tuple
      const [_key, slug] = queryKey as [string, string];
      const response = await fetch(`/api/static-content/${slug}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ArticleData = await response.json();
      return data;
    },
    [],
  );

  const { data, isLoading, isError, error } = useQuery<ArticleData, Error>({
    queryKey: ['articleContent', contentSlug],
    queryFn: fetchArticleContent,
    enabled: !!contentSlug, // Only run the query if contentSlug is available
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  if (isLoading) {
    return <p>Loading article content...</p>;
  }

  if (isError) {
    return <p className="text-red-500">Error: {error?.message}</p>;
  }

  if (!data || !data.source || !data.frontmatter) {
    return <p>No article content available or missing data.</p>;
  }

  const { source: mdxSource, frontmatter } = data;

  return (
    <div>
      {frontmatter.title && (
        <h2 className="text-gray-900 dark:text-gray-100">
          {frontmatter.title}
        </h2>
      )}
      <div className="prose dark:prose-invert">
        <MDXRemote {...mdxSource} components={components} />
      </div>
    </div>
  );
};

export default ArticleModule;
