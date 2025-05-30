'use client';

import { components } from './MdxRenderer';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { useEffect, useState } from 'react';
import { cachedFetch } from '../lib/api-cache';

const ErrorGuide = () => {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [mdxSource, setMdxSource] = useState<MDXRemoteSerializeResult | null>(
    null,
  );
  const [frontmatter, setFrontmatter] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMdxContent = async () => {
      setLoading(true);
      const response = await cachedFetch('/error-guide');
      const data = await response.json();
      setMdxSource(data.source);
      setFrontmatter(data.frontmatter || {});
      setKeywords(data.frontmatter?.keywords || []);
      setLoading(false);
    };

    fetchMdxContent();
  }, []);

  if (loading) return <p>Loading error guide...</p>;
  if (!mdxSource) return <p>No error guide content available.</p>;

  return (
    <div>
      {mdxSource && <MDXRemote {...mdxSource} components={components} />}
    </div>
  );
};

export default ErrorGuide;
