'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { components as mdxComponents } from '@/components/MdxRenderer'; // Renamed to avoid conflict
import {
  useQuery,
  QueryKey,
  QueryFunctionContext,
} from '@tanstack/react-query';
import { TableOfContents } from './TableOfContents'; // Import TableOfContents

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface ArticleModuleProps {
  contentSlug: string;
}

interface ArticleData {
  source: MDXRemoteSerializeResult;
  frontmatter: {
    title?: string;
    [key: string]: any;
  };
}

const ArticleModule: React.FC<ArticleModuleProps> = ({ contentSlug }) => {
  const [headings, setHeadings] = useState<Heading[]>([]);

  const fetchArticleContent = useCallback(
    async ({ queryKey }: QueryFunctionContext<QueryKey>) => {
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
    enabled: !!contentSlug,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (data) {
      // Extract headings after MDX content has rendered
      const extractedHeadings: Heading[] = [];
      document.querySelectorAll('h2, h3, h4').forEach((heading) => {
        if (heading.id && heading.textContent) {
          extractedHeadings.push({
            id: heading.id,
            text: heading.textContent,
            level: parseInt(heading.tagName.substring(1)), // 'H2' -> 2
          });
        }
      });
      setHeadings(extractedHeadings);
    }
  }, [data]); // Re-run when data changes (i.e., content loads)

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
    <div className="flex">
      <div className="flex-grow">
        {frontmatter.title && (
          <h2 className="text-gray-900 dark:text-gray-100">
            {frontmatter.title}
          </h2>
        )}
        <div className="prose dark:prose-invert">
          <MDXRemote {...mdxSource} components={mdxComponents} />
        </div>
      </div>
      <TableOfContents headings={headings} />
    </div>
  );
};

export default ArticleModule;
