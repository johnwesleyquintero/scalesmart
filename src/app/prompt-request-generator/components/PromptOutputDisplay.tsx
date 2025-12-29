import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { components } from '@/components/MdxRenderer';
import { Check, Copy, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PromptOutputSkeleton } from './Skeleton';

interface PromptOutputDisplayProps {
  output: string;
  onCopy?: () => void;
  isLoading?: boolean;
}

const PromptOutputDisplay: React.FC<PromptOutputDisplayProps> = ({
  output,
  onCopy,
  isLoading = false,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    if (!output) return;

    try {
      await navigator.clipboard.writeText(output);
      setIsCopied(true);
      onCopy?.();

      // Reset copy state after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (!output) {
    return (
      <div className="flex items-center justify-center h-48 bg-muted/10 rounded-lg border border-dashed border-border/50">
        <p className="text-muted-foreground text-sm italic">
          Prompt output will appear here.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-muted/30 to-muted/50 rounded-lg border border-border/50">
        <PromptOutputSkeleton />
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className={cn(
            'h-8 px-3 transition-all duration-200',
            isCopied
              ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300'
              : 'bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background',
          )}
        >
          {isCopied ? (
            <>
              <Check className="w-4 h-4 mr-1" />
              <span className="text-xs">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-1" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </Button>
      </div>

      <div className="bg-gradient-to-br from-muted/30 to-muted/50 p-4 rounded-lg font-mono text-sm overflow-y-auto max-h-[400px] prose dark:prose-invert border border-border/50 transition-all duration-200 hover:border-border/70">
        <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
          {output}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default PromptOutputDisplay;
