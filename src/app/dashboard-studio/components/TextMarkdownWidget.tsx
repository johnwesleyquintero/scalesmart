import React from 'react';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { components } from '@/components/MdxRenderer'; // Assuming MdxRenderer exports components

interface TextMarkdownWidgetProps {
  id: string;
  content: string;
}

const TextMarkdownWidget: React.FC<TextMarkdownWidgetProps> = ({ content }) => {
  return (
    <div className="prose dark:prose-invert max-w-none">
      {/* MDXRemote will render the markdown content */}
      <MDXRemote source={content} components={components} />
    </div>
  );
};

export default TextMarkdownWidget;
