'use client';

import React, { useMemo } from 'react';
import { MDXProvider } from '@mdx-js/react';
import Quiz from './Quiz';
import ExerciseModule from './ExerciseModule';

interface MdxRendererProps {
  content: string;
}

const MdxRenderer: React.FC<MdxRendererProps> = ({ content }) => {
  const components = useMemo(
    () => ({
      Quiz: Quiz,
      ExerciseModule: ExerciseModule,
    }),
    [],
  );

  return <MDXProvider components={components}>{content}</MDXProvider>;
};

export default MdxRenderer;
