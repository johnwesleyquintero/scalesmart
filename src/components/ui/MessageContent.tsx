import React, { useMemo } from 'react';
import ReactMarkdown, {
  type Options as ReactMarkdownOptions,
} from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypePrismPlus from 'rehype-prism-plus';
import type { Element as HastElement } from 'hast';
import CopyMarkdownButton from './CopyMarkdownButton';
import MermaidDiagram from './MermaidDiagram';

interface CodeBlockProps extends React.HTMLAttributes<HTMLElement> {
  node?: HastElement;
  inline?: boolean;
  children?: React.ReactNode;
}

function CodeBlock({
  node,
  inline,
  className,
  children,
  ...htmlProps
}: CodeBlockProps) {
  const match = /language-(\w+)/.exec(className || '');
  const lang = match?.[1] ?? (inline ? undefined : 'text');

  if (inline) {
    return (
      <code className={className} {...htmlProps}>
        {children}
      </code>
    );
  }

  const codeContent = Array.isArray(children)
    ? children.join('')
    : String(children);
  const cleanedCodeContent = codeContent.replace(/\n$/, '');

  return (
    <div
      className={`relative group code-block-wrapper ${className}`}
      {...htmlProps}
    >
      <code className={className}>{cleanedCodeContent}</code>
      <CopyMarkdownButton content={cleanedCodeContent} type="code" />
    </div>
  );
}

const markdownComponentsConfig: ReactMarkdownOptions['components'] = {
  code: CodeBlock,
  table: ({ node: _node, ...props }) => (
    <div className="overflow-x-auto rounded-md border">
      <table
        className="w-full caption-bottom text-sm border-collapse"
        {...props}
      />
    </div>
  ),
  thead: ({ node: _node, ...props }) => (
    <thead className="[&>tr]:border-b" {...props} />
  ),
  tbody: ({ node: _node, ...props }) => (
    <tbody className="[&>tr]:border-b" {...props} />
  ),
  tr: ({ node: _node, ...props }) => (
    <tr className="m-0 border-t p-0 even:bg-muted/50" {...props} />
  ),
  th: ({ node: _node, ...props }) => (
    <th
      className="border px-4 py-2 text-left font-bold [&[align=left]]:text-left [&[align=center]]:text-center [&[align=right]]:text-right"
      {...props}
    />
  ),
  td: ({ node: _node, ...props }) => (
    <td
      className="border px-4 py-2 text-left [&[align=left]]:text-left [&[align=center]]:text-center [&[align=right]]:text-right"
      {...props}
    />
  ),
  blockquote: ({ node: _node, ...props }) => (
    <blockquote className="mt-6 border-l-2 pl-6 italic" {...props} />
  ),
  ul: ({ node: _node, ...props }) => (
    <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props} />
  ),
  ol: ({ node: _node, ...props }) => (
    <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props} />
  ),
  h2: ({ node: _node, ...props }) => (
    <h2
      className="mt-10 border-b pb-2 text-2xl font-bold tracking-tight transition-colors first:mt-0"
      {...props}
    />
  ),
  a: ({ node: _node, ...props }) => (
    <a className="font-medium text-blue-600 underline" {...props} />
  ),
  p: ({ node, ...props }) => {
    if (
      node?.children.some(
        (child) => child.type === 'element' && child.tagName === 'pre',
      )
    ) {
      return <>{props.children}</>;
    }
    return <p className="leading-7 [&:not(:first-child)]:mt-6" {...props} />;
  },
};

interface MessageContentProps {
  content: string;
}

const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  const renderedContent = useMemo(() => {
    // Check for Mermaid diagram
    const mermaidMatch = content.match(/^```mermaid\n([\s\S]*?)\n```$/);
    if (mermaidMatch) {
      return <MermaidDiagram chart={mermaidMatch[1]} />;
    }

    // Default rendering: Use ReactMarkdown for all other content.
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeRaw,
          rehypeKatex,
          [rehypePrismPlus, { ignoreMissing: true }],
        ]}
        components={markdownComponentsConfig}
      >
        {content}
      </ReactMarkdown>
    );
  }, [content]);

  return <>{renderedContent}</>;
};

export default MessageContent;
