// // @ts-nocheck is not recommended

'use client';

import { cn } from '@/lib/utils';
import {
  Clipboard,
  ClipboardCheck,
  Eye,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import React, { ReactNode, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypePrismPlus from 'rehype-prism-plus';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { Dialog, DialogContent, DialogTitle } from './dialog';

interface ReactMarkdownProps {
  children: ReactNode;
  remarkPlugins: Pluggable[];
  rehypePlugins: Pluggable[];
  className?: string;
}

import { Pluggable } from 'unified';
import { Message } from './chat-interface';

interface MessageBubbleProps {
  message: Message;
  onRetry?: (message: Message) => void;
  onDelete?: (timestamp: number) => void;
}

export function MessageBubble({
  message,
  onRetry,
  onDelete,
}: MessageBubbleProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const isError = message.status === 'error';
  const isSending = message.status === 'sending';
  const isAssistant = message.role === 'assistant';

  const handleCopyClick = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const renderMessageContent = () => {
    return (
      <ReactMarkdown
        {...({
          remarkPlugins: [remarkGfm, remarkMath],
          rehypePlugins: [
            rehypeKatex,
            [rehypePrismPlus, { ignoreMissing: true }] as Pluggable,
          ],
          className: 'prose prose-sm dark:prose-invert max-w-none break-words',
        } as ReactMarkdownProps)}
        components={{
          pre: (props: React.ComponentProps<'pre'>) => {
            return (
              <div className="relative group">
                <pre {...props} className="rounded-md p-4 overflow-x-auto" />
                <button
                  onClick={() =>
                    handleCopyClick(
                      (Array.isArray(props.children) &&
                        props.children.length > 0 &&
                        (props.children[0]?.children[0]?.value as string)) ||
                        '',
                    )
                  }
                  className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Copy code"
                >
                  {isCopied ? (
                    <ClipboardCheck className="h-4 w-4 text-green-500" />
                  ) : (
                    <Clipboard className="h-4 w-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
                  )}
                </button>
              </div>
            );
          },
          code: (
            props: React.ComponentProps<'code'> & { inline?: boolean },
          ) => {
            return (
              <code
                {...props}
                className={cn(
                  'bg-muted px-1.5 py-0.5 rounded-md text-sm',
                  props.inline ? 'inline-block' : 'block',
                )}
              />
            );
          },
        }}
      >
        {message.content}
      </ReactMarkdown>
    );
  };

  return (
    <div
      className={cn(
        'flex w-full',
        isAssistant ? 'justify-start' : 'justify-end',
      )}
    >
      <div
        className={cn(
          'relative flex flex-col gap-2 rounded-lg p-4 max-w-[85%]',
          isAssistant
            ? 'bg-gray-100 dark:bg-gray-800'
            : 'bg-primary text-primary-foreground',
          isError &&
            'bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30',
        )}
      >
        <DialogTitle>Message</DialogTitle>
        {renderMessageContent()}

        {/* Message Actions */}
        <div className="flex gap-2 mt-2 justify-end">
          {message.content.includes('```') && (
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="text-xs flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Preview full message"
            >
              <Eye className="h-3 w-3" />
              Preview
            </button>
          )}
          {isError && onRetry && (
            <button
              onClick={() => onRetry(message)}
              className="text-xs flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              disabled={isSending}
              aria-label="Retry sending message"
            >
              <RotateCcw className="h-3 w-3" />
              Retry
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(message.timestamp)}
              className="text-xs flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Delete message"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          )}
        </div>

        {/* Error Message */}
        {isError && message.error && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-2">
            {message.error}
          </p>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="mt-4">{renderMessageContent()}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
