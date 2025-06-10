'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Element } from 'hast';
import { CSSProperties, useState } from 'react';

const codeStyle = atomDark;
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react'; // Import Check icon
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/lib/utils/clipboard';

interface NoteContentProps {
  markdown: string;
}

const NoteContent: React.FC<NoteContentProps> = ({ markdown }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false); // State for copy feedback

  const handleCopy = async (text: string) => {
    try {
      await copyToClipboard(text);
      setCopied(true); // Set copied state to true
      toast({
        title: 'Copied!',
        description: 'Code copied to clipboard.',
        duration: 2000,
      });
      // Reset copied state after a short delay
      setTimeout(() => {
        setCopied(false);
      }, 2000); // Match toast duration
    } catch (error: unknown) {
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
            const codeContent = String(children).replace(/\n$/, '');
            return !inline && match ? (
              <div className="relative group">
                {' '}
                {/* Added group class for potential future styling */}
                <SyntaxHighlighter
                  style={codeStyle}
                  language={match[1]}
                  PreTag="div"
                  className={className}
                >
                  {codeContent}
                </SyntaxHighlighter>
                {/* Top copy button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" // Added opacity for hover effect
                  onClick={() => handleCopy(codeContent)}
                  aria-label="Copy code to clipboard" // Added ARIA label
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}{' '}
                  {/* Conditional icon rendering */}
                </Button>
                {/* Bottom copy button for long code blocks */}
                <div className="flex justify-end mt-2">
                  {' '}
                  {/* Container for bottom button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(codeContent)}
                    aria-label="Copy code to clipboard" // Added ARIA label
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}{' '}
                    {/* Conditional icon rendering */}
                  </Button>
                </div>
              </div>
            ) : (
              <span className="relative group inline-flex items-center">
                {' '}
                {/* Container for inline code */}
                <code className={className}>{children}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute -top-1 right-0 transform translate-x-full opacity-0 group-hover:opacity-100 transition-opacity p-0 h-4 w-4" // Adjusted positioning and size for inline
                  onClick={() => handleCopy(String(children))} // Handle copy for inline code
                  aria-label="Copy inline code to clipboard" // Added ARIA label
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}{' '}
                  {/* Conditional icon rendering, smaller size */}
                </Button>
              </span>
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
