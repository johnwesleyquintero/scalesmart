'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Element } from 'hast';
import { CSSProperties } from 'react';

const codeStyle = atomDark;
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/lib/utils/clipboard';

interface NoteContentProps {
  markdown: string;
}

const NoteContent: React.FC<NoteContentProps> = ({ markdown }) => {
  const { toast } = useToast();

  const handleCopy = async (text: string) => {
    try {
      await copyToClipboard(text);
      toast({
        title: 'Copied!',
        description: 'Code copied to clipboard.',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy code.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="border rounded-md p-4 overflow-y-auto min-h-[300px] prose dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({
            node,
            inline,
            className,
            children,
          }: {
            node?: Element;
            inline?: boolean;
            className?: string;
            children?: React.ReactNode;
          } & React.HTMLAttributes<HTMLElement>) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="relative">
                <SyntaxHighlighter
                  style={codeStyle}
                  language={match[1]}
                  PreTag="div"
                  className={className}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() =>
                    handleCopy(String(children).replace(/\n$/, ''))
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <code className={className}>{children}</code>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
};

export default NoteContent;
