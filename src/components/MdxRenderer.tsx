'use client';

import React, { useMemo } from 'react';
import { MDXProvider } from '@mdx-js/react';
import Quiz from './Quiz';
import ExerciseModule from './ExerciseModule';

interface MdxRendererProps {
  content: string;
  keywords: string[];
}

const MdxRenderer: React.FC<MdxRendererProps> = ({ content, keywords }) => {
  const components = useMemo(
    () => ({
      Quiz: Quiz,
      ExerciseModule: ExerciseModule,
    }),
    [],
  );

  const highlightedContent = useMemo(() => {
    if (!keywords || keywords.length === 0) {
      return content;
    }

    let highlighted = content;
    keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
      highlighted = highlighted.replace(
        regex,
        (match) => `<span class="bg-yellow-200">${match}</span>`,
      );
    });
    return highlighted;
  }, [content, keywords]);

  return (
    <MDXProvider components={components}>
      <div dangerouslySetInnerHTML={{ __html: highlightedContent }} />
    </MDXProvider>
  );
};

export default MdxRenderer;
