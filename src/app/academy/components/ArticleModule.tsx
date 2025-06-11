'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { components as components } from '../../../components/MdxRenderer';
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

    [key: string]: unknown; // Changed from any to unknown for better type safety
  };
}

import { useAcademy } from '@/context/AcademyContext';

const ArticleModule: React.FC<ArticleModuleProps> = ({ contentSlug }) => {
  const { activeCourse, updateModuleProgress, activeModule } = useAcademy();
  const articleRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!activeCourse || !activeModule || !articleRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = articleRef.current;
    const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100;
    const progress = Math.min(100, Math.max(0, Math.round(scrollPercentage)));

    updateModuleProgress(activeCourse.id, activeModule.id, progress);
  }, [activeCourse, activeModule, updateModuleProgress]);

  useEffect(() => {
    const articleElement = articleRef.current;
    if (articleElement) {
      articleElement.addEventListener('scroll', handleScroll);
      // Initial progress update in case the article is shorter than the viewport
      handleScroll();
      return () => {
        articleElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll]);

  // Use QueryKey for the parameter and assert type internally
  const fetchArticleContent = useCallback(
    async ({ queryKey }: QueryFunctionContext<QueryKey>) => {
      const [_key, slug] = queryKey as [string, string];
      const response = await fetch(`/api/academy/academy-article/${slug}`);
      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'No response body');
        throw new Error(
          `Failed to fetch article content for slug "${slug}". Status: ${response.status}. Details: ${errorBody}`,
        );
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
    <div ref={articleRef} className="overflow-y-auto h-full">
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
