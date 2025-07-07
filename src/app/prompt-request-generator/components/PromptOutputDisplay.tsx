import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { components } from '@/components/MdxRenderer';

interface PromptOutputDisplayProps {
  output: string;
}

const PromptOutputDisplay: React.FC<PromptOutputDisplayProps> = ({
  output,
}) => {
  if (!output) {
    return (
      <div className="flex items-center justify-center h-48 bg-muted rounded-md">
        <p className="text-muted-foreground">
          Your generated prompt will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-muted p-4 rounded-md font-mono text-sm overflow-y-auto max-h-[400px] prose dark:prose-invert">
      <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
        {output}
      </ReactMarkdown>
    </div>
  );
};

export default PromptOutputDisplay;
