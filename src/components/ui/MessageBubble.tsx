// React and Hooks
import React, { useMemo } from 'react';
import type { HTMLAttributes, PropsWithChildren } from 'react'; // Import PropsWithChildren

// Third-party Libraries
import ReactMarkdown, {
  type Options as ReactMarkdownOptions,
} from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { RotateCcw, Trash2 } from 'lucide-react';
import type { Element as HastElement } from 'hast'; // For HAST node type

// Local Utilities and Components
import { cn } from '@/lib/utils';
import { Button } from './button';
import CopyMarkdownButton from './CopyMarkdownButton';
import HtmlPreview from './HtmlPreview';
import JsonViewer from './JsonViewer';
import MermaidDiagram from './MermaidDiagram';

// Types
import { Message } from './chat-interface';

// Props specific to the 'code' component renderer in react-markdown, beyond standard HTML attributes
interface ReactMarkdownSpecificCodeProps {
  node?: HastElement; // The HAST (HTML Abstract Syntax Tree) node, made optional to address TS error
  inline?: boolean; // True if rendering inline code, false/undefined for block code
}

// Combined props for the custom CodeBlock component:
// - PropsWithChildren adds 'children'
// - ReactMarkdownSpecificCodeProps adds 'node' and 'inline'
// - HTMLAttributes<HTMLElement> adds standard HTML attributes like 'className', 'id', event handlers, etc.
type CodeBlockProps = PropsWithChildren<
  ReactMarkdownSpecificCodeProps & HTMLAttributes<HTMLElement>
>;

interface MessageBubbleProps {
  message: Message;
  onRetry: (content: string, message: Message) => void;
  onDelete: (timestamp: number) => void;
}

// Type guard for JSON content
const isJsonString = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

// Type guard for Mermaid content
const isMermaidContent = (content: string): boolean => {
  return content.startsWith('```mermaid') && content.endsWith('```');
};

// Type guard for HTML content
const isHtmlContent = (content: string): boolean => {
  return /<\/?\w+((\s+\w+(=['"][^"'<>]*['"])?)*|\s*)\/?>/g.test(content);
};

/**
 * Custom CodeBlock component for rendering code blocks within ReactMarkdown.
 * Handles syntax highlighting using Prism and provides a copy button.
 */
const CodeBlock: React.FC<CodeBlockProps> = ({
  node, // Destructured from ReactMarkdownSpecificCodeProps
  inline, // Destructured from ReactMarkdownSpecificCodeProps
  className, // Destructured from HTMLAttributes<HTMLElement>
  children, // Destructured from PropsWithChildren
  ...htmlProps // Remaining HTMLAttributes<HTMLElement> (e.g., id, data-*)
}) => {
  console.log('CodeBlock Props Received:', {
    node,
    inline,
    className,
    children,
    htmlProps,
  });
  const match = /language-(\w+)/.exec(className || '');
  const lang = match?.[1] ?? (inline ? undefined : 'text');

  if (inline) {
    // For inline code, render a simple <code> tag.
    // htmlProps are HTMLAttributes<HTMLElement>, compatible with <code>.
    return (
      <code className={className} {...htmlProps}>
        {children}
      </code>
    );
  }

  const codeContent = String(children).replace(/\n$/, '');

  // For block code, htmlProps are applied to this wrapper div.
  // htmlProps are HTMLAttributes<HTMLElement>, compatible with <div>.
  return (
    <div className="relative group code-block-wrapper" {...htmlProps}>
      <SyntaxHighlighter
        style={atomDark}
        language={lang}
        PreTag="div"
        // Do NOT spread htmlProps here; SyntaxHighlighter has its own prop API.
      >
        {codeContent}
      </SyntaxHighlighter>
      <CopyMarkdownButton content={codeContent} type="code" />
    </div>
  );
};

/**
 * Configuration for ReactMarkdown components.
 * This is defined outside the MessageBubble component to prevent re-creation on every render.
 */
const markdownComponentsConfig: ReactMarkdownOptions['components'] = {
  code: CodeBlock, // Use the custom CodeBlock component
  table: (
    { node: _node, ...props }, // _node to signify it's available but not used
  ) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200" {...props} />
    </div>
  ),
  th: ({ node: _node, ...props }) => (
    <th
      className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
      {...props}
    />
  ),
  td: ({ node: _node, ...props }) => (
    <td
      className="px-4 py-2 whitespace-nowrap text-sm text-gray-900"
      {...props}
    />
  ),
};

export default function MessageBubble({
  message,
  onRetry,
  onDelete,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';

  const renderedContent = useMemo(() => {
    const { content } = message;

    if (isJsonString(content)) {
      try {
        const parsed = JSON.parse(content);
        return <JsonViewer jsonContent={JSON.stringify(parsed, null, 2)} />;
      } catch (error) {
        console.error('JSON parsing error:', error);
      }
    }

    if (isMermaidContent(content)) {
      const diagram = content
        .substring('```mermaid'.length, content.length - '```'.length)
        .trim();
      return <MermaidDiagram chart={diagram} />;
    }

    if (isHtmlContent(content)) {
      return <HtmlPreview htmlContent={content} />;
    }

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeKatex]}
        components={markdownComponentsConfig}
      >
        {content}
      </ReactMarkdown>
    );
  }, [message.content]);

  return (
    <div
      className={cn('flex group', isUser ? 'justify-end' : 'justify-start')}
      role="listitem"
      aria-live={message.status === 'sending' ? 'polite' : 'off'}
    >
      <div
        className={cn(
          'relative p-3 rounded-lg max-w-[80%] whitespace-pre-wrap',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground',
        )}
      >
        {renderedContent}

        {message.status === 'sending' && !isUser && (
          <span className="ml-2 text-xs opacity-70">Typing...</span>
        )}

        {message.status === 'error' && isUser && (
          <div className="text-sm text-red-500 mt-1">
            <p>Error: {message.error || 'Failed to send.'}</p>
            {(message.retryCount ?? 0) < (message.retryLimit ?? 3) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRetry(message.content, message)}
                className="text-red-300 hover:text-red-200 p-0 h-auto mt-1"
                aria-label={`Retry sending message (attempt ${message.retryCount ?? 0} of ${message.retryLimit ?? 3})`}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Retry ({message.retryCount ?? 0}/{message.retryLimit ?? 3})
              </Button>
            )}
          </div>
        )}

        <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(message.timestamp)}
            aria-label="Delete message"
            title="Delete"
          >
            <Trash2 className="w-3 h-3 text-red-400 hover:text-red-500" />
          </Button>
        </div>
      </div>
    </div>
  );
}
