'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMermaid from 'remark-mermaid';
import rehypeMermaid from 'rehype-mermaid';

interface DynamicMarkdownRendererProps {
  markdown: string;
}

const DynamicMarkdownRenderer: React.FC<DynamicMarkdownRendererProps> = ({
  markdown,
}) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMermaid]}
      rehypePlugins={[rehypeMermaid]}
    >
      {markdown}
    </ReactMarkdown>
  );
};

export default DynamicMarkdownRenderer;
