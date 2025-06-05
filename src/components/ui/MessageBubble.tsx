// React and Hooks
import React, { useMemo } from 'react';
// Using React.HTMLAttributes<HTMLElement> directly might be clearer than PropsWithChildren & HTMLAttributes<HTMLElement>
import type { HTMLAttributes } from 'react';

// Third-party Libraries
import ReactMarkdown, {
  type Options as ReactMarkdownOptions,
} from 'react-markdown';
// Ensure esm styles are correctly imported and used
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize'; // Important for security when rendering HTML
import { RotateCcw, Trash2, Edit } from 'lucide-react'; // Import Edit icon
import type { Element as HastElement } from 'hast'; // For HAST node type

// Local Utilities and Components
import { cn } from '../../lib/utils';
import { Button } from './button'; // Assuming this is a local Button component
import CopyMarkdownButton from './CopyMarkdownButton';
import HtmlPreview from './HtmlPreview'; // Assumes HtmlPreview sanitizes or source is trusted
import JsonViewer from './JsonViewer';
import MermaidDiagram from './MermaidDiagram';

// Types
import { Message } from './chat-interface'; // Assuming Message type is defined here

// Define type for CodeBlock props explicitly
interface CodeBlockProps extends HTMLAttributes<HTMLElement> {
  node?: HastElement;
  inline?: boolean;
  // children are implicitly included via React.ReactNode due to rendering within ReactMarkdown,
  // but specifically typing them as string or string[] often fits the context of code blocks.
  // Using React.ReactNode is safest if children could be mixed types, but for code blocks,
  // it's typically a string or array of strings/nodes.
  children?: React.ReactNode;
}

interface MessageBubbleProps {
  message: Message;
  // Refined retry signature: pass message id/timestamp? Or just content+message as currently
  // Content + message seems fine if the handler needs full message context
  onRetry: (content: string, message: Message) => void;
  onDelete: (timestamp: number) => void;
  onEdit: (message: Message) => void;
}

// --- Type Guards ---
// Using type guards to determine content type is a reasonable approach,
// but order matters and heuristics have limits.

const isJsonString = (str: string): boolean => {
  // Basic check: must start and end with {} or [], and be parseable
  if (!/^\s*[{[]/.test(str) || !/[}\]]\s*$/.test(str)) {
    return false;
  }
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

const isMermaidContent = (content: string): boolean => {
  // Mermaid blocks are typically fenced code blocks with 'mermaid' language
  return content.startsWith('```mermaid\n') && content.endsWith('\n```');
};

// Note on isHtmlContent: This is a WEAK heuristic.
// If security is critical, assume ALL bot messages could contain malicious HTML
// unless explicitly marked otherwise or rendered ONLY through a sanitizing markdown parser.
// The current structure renders via HtmlPreview *if* this heuristic matches, bypassing rehypeSanitize.
// Ensure HtmlPreview component performs robust sanitization if used for untrusted content.
const isHtmlContent = (content: string): boolean => {
  // Look for common HTML tags as a basic indicator.
  // This is not foolproof and may have false positives/negatives.
  const htmlTagRegex = /<\w+[^>]*>.*?<\/\w+>|<\w+\s*\/>/s;
  return htmlTagRegex.test(content);
};

// --- Custom Markdown Components ---

/**
 * Custom CodeBlock component for rendering code blocks within ReactMarkdown.
 * Handles syntax highlighting using Prism and provides a copy button.
 * It respects the `inline` prop from ReactMarkdown.
 */
function CodeBlock({
  node, // Available but not used for rendering logic here
  inline,
  className,
  children,
  ...htmlProps // Remaining HTMLAttributes<HTMLElement>
}: CodeBlockProps) {
  // Extract language from className, typically in the format "language-xyz"
  const match = /language-(\w+)/.exec(className || '');
  // Determine language: use matched language, 'text' for block code if no language specified, undefined for inline
  const lang = match?.[1] ?? (inline ? undefined : 'text');

  if (inline) {
    // Render inline code with a simple <code> tag.
    // Apply className and any other standard HTML attributes to the <code> tag.
    return (
      <code className={className} {...htmlProps}>
        {children}
      </code>
    );
  }

  // For block code, SyntaxHighlighter expects a single string child.
  // Children from react-markdown can be an array, so concatenate them.
  // Remove trailing newline often present in fenced code blocks.
  const codeContent = Array.isArray(children)
    ? children.join('')
    : String(children);
  const cleanedCodeContent = codeContent.replace(/\n$/, '');

  return (
    // Wrapper div to position the copy button relative to the code block.
    // htmlProps are applied to this wrapper div, which is generally appropriate
    // for block-level elements rendered by ReactMarkdown.
    <div className="relative group code-block-wrapper" {...htmlProps}>
      <SyntaxHighlighter
        style={atomDark} // Apply the chosen syntax highlighting theme
        language={lang} // Set the detected or default language
        PreTag="div" // Render as a div instead of a pre tag, common for layout control
        // CodeTag="code" // Default is 'code', can be specified if needed
        // Do NOT spread htmlProps here; SyntaxHighlighter has specific props.
        // Any props like 'id', 'data-*' etc., intended for the *pre* tag might need
        // to be passed via a specific prop if the library supports it, or applied to the wrapper.
      >
        {cleanedCodeContent}
      </SyntaxHighlighter>
      {/* Position the Copy button absolutely within the wrapper */}
      <CopyMarkdownButton content={cleanedCodeContent} type="code" />
    </div>
  );
}

/**
 * Configuration for ReactMarkdown components.
 * Defined outside the component to avoid re-creation on every render,
 * which could impact React's reconciliation performance.
 */
const markdownComponentsConfig: ReactMarkdownOptions['components'] = {
  code: CodeBlock, // Use the custom CodeBlock component for all `code` elements (inline and block)
  // Customize table rendering for better responsiveness and styling
  table: ({ node: _node, ...props }) => (
    <div className="overflow-x-auto rounded-md border">
      {' '}
      {/* Added border and rounded corners */}
      {/* Removed min-w-full to allow table to shrink, added border-collapse */}
      <table
        className="w-full caption-bottom text-sm border-collapse"
        {...props}
      />
    </div>
  ),
  thead: ({ node: _node, ...props }) => (
    <thead className="[&>tr]:border-b" {...props} />
  ), // Add border to head row
  tbody: ({ node: _node, ...props }) => (
    <tbody className="[&>tr]:border-b" {...props} />
  ), // Add border to body rows
  tr: ({ node: _node, ...props }) => (
    <tr className="m-0 border-t p-0 even:bg-muted/50" {...props} />
  ), // Style table rows
  th: ({ node: _node, ...props }) => (
    // Use Tailwind classes for header styling
    <th
      className="border px-4 py-2 text-left font-bold [&[align=left]]:text-left [&[align=center]]:text-center [&[align=right]]:text-right"
      {...props}
    />
  ),
  td: ({ node: _node, ...props }) => (
    // Use Tailwind classes for cell styling
    <td
      className="border px-4 py-2 text-left [&[align=left]]:text-left [&[align=center]]:text-center [&[align=right]]:text-right"
      {...props}
    />
  ),
  // Add styling for blockquotes
  blockquote: ({ node: _node, ...props }) => (
    <blockquote
      className="mt-6 border-l-2 pl-6 italic" // Tailwind classes for blockquote style
      {...props}
    />
  ),
  // Add styling for lists
  ul: ({ node: _node, ...props }) => (
    <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props} /> // Tailwind list styling
  ),
  ol: ({ node: _node, ...props }) => (
    <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props} /> // Tailwind list styling
  ),
  // Add styling for headings (example H2)
  h2: ({ node: _node, ...props }) => (
    <h2
      className="mt-10 border-b pb-2 text-2xl font-bold tracking-tight transition-colors first:mt-0" // Tailwind heading style
      {...props}
    />
  ),
  // Add styling for links
  a: ({ node: _node, ...props }) => (
    <a className="font-medium text-blue-600 underline" {...props} /> // Simple blue underline for links
  ),
  // Add styling for paragraphs
  p: ({ node: _node, ...props }) => (
    <p className="leading-7 [&:not(:first-child)]:mt-6" {...props} /> // Paragraph spacing
  ),
};

interface MessageStatusIndicatorProps {
  message: Message;
  isUser: boolean;
  onRetry: (content: string, message: Message) => void; // Matches MessageBubbleProps signature
}

/**
 * Renders message status indicators (Typing, Error).
 * Handles retry logic for failed user messages.
 */
function MessageStatusIndicator({
  message,
  isUser,
  onRetry,
}: MessageStatusIndicatorProps) {
  // Typing indicator for non-user messages that are sending
  if (message.status === 'sending' && !isUser) {
    return <span className="ml-2 text-xs opacity-70">Typing...</span>;
  }

  // Error indicator for user messages that failed
  if (message.status === 'error' && isUser) {
    // Safely access retryCount and retryLimit with default values
    const retryCount = message.retryCount ?? 0;
    const retryLimit = message.retryLimit ?? 3;
    const canRetry = retryCount < retryLimit;

    return (
      <div className="text-sm text-red-500 mt-1">
        <p>Error: {message.error || 'Failed to send.'}</p>
        {/* Show retry button if within limit */}
        {canRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRetry(message.content, message)}
            className="text-red-300 hover:text-red-200 p-0 h-auto mt-1"
            // FIXED: Use template literal for aria-label string interpolation
            aria-label={`Retry sending message (attempt ${retryCount} of ${retryLimit})`}
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            {/* FIXED: Use template literal for button text */}
            {`Retry (${retryCount}/${retryLimit})`}
          </Button>
        )}
      </div>
    );
  }

  // No status to display for other cases (e.g., sent, received bot messages)
  return null;
}

interface MessageActionsProps {
  message: Message;
  isUser: boolean;
  onEdit: (message: Message) => void; // Matches MessageBubbleProps signature
  onDelete: (timestamp: number) => void; // Matches MessageBubbleProps signature
}

/**
 * Renders action buttons (Edit, Delete) for the message bubble.
 * These actions typically appear on hover.
 */
function MessageActions({
  message,
  isUser,
  onEdit,
  onDelete,
}: MessageActionsProps) {
  // Actions are only relevant for messages that have been 'sent'
  if (message.status !== 'sent') {
    return null;
  }

  return (
    // Position actions absolutely, hide by default and show on parent group hover
    <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
      {' '}
      {/* Added z-index */}
      {/* Edit Button: Only for sent user messages */}
      {isUser && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(message)}
          aria-label="Edit message"
          title="Edit"
          className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400" // Added text color classes
        >
          {/* REPLACED inline SVG with Lucide icon */}
          <Edit className="w-3 h-3" />
        </Button>
      )}
      {/* Delete Button: Available for sent messages */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(message.timestamp)}
        aria-label="Delete message"
        title="Delete"
        className="text-red-400 hover:text-red-500 dark:text-red-500 dark:hover:text-red-400" // Added text color classes
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
}

/**
 * MessageBubble component displays a single chat message.
 * It handles rendering different content types (Markdown, JSON, Mermaid, HTML)
 * and includes status indicators and action buttons based on message state and role.
 */
export default function MessageBubble({
  message,
  onRetry,
  onDelete,
  onEdit,
}: MessageBubbleProps) {
  // Determine if the message is from the user
  const isUser = message.role === 'user';

  // Use useMemo to cache the rendered content React element/tree.
  // This prevents re-calculating the content type and parsing/rendering
  // the content unless the message content itself changes.
  const renderedContent = useMemo(() => {
    const { content } = message;

    // Check for specific content types based on heuristics.
    // The order of checks might matter if there are overlaps (e.g., fenced code blocks containing JSON/Mermaid).
    // Current order: JSON, Mermaid, HTML, then fallback to generic Markdown.

    if (isJsonString(content)) {
      try {
        const parsed = JSON.parse(content);
        // Render as a JSON viewer component if successfully parsed
        // JSON.stringify with null, 2 provides pretty-printing
        return <JsonViewer jsonContent={JSON.stringify(parsed, null, 2)} />;
      } catch (error) {
        console.error('JSON parsing error:', error);
        // Fallback to rendering an error message if JSON is detected but invalid
        return (
          <p className="text-red-500 dark:text-red-400">
            Error parsing JSON:{' '}
            {error instanceof Error ? error.message : String(error)}
          </p>
        );
      }
    }

    if (isMermaidContent(content)) {
      // Extract the diagram definition from the fenced block
      const diagram = content
        .substring('```mermaid\n'.length, content.length - '\n```'.length)
        .trim();
      // Render as a Mermaid diagram component
      return <MermaidDiagram chart={diagram} />;
    }

    // IMPORTANT SECURITY NOTE: isHtmlContent is a heuristic.
    // If HtmlPreview does NOT sanitize its input and the message source is untrusted,
    // rendering HTML directly via this path is a security risk (XSS).
    // Ensure HtmlPreview sanitizes or only use this for trusted content.
    // If all content should be sanitized HTML, remove this check and let ReactMarkdown + rehypeSanitize handle it.
    if (isHtmlContent(content)) {
      // Render as an HTML preview component
      return <HtmlPreview htmlContent={content} />;
    }

    // Default rendering: Use ReactMarkdown for all other content.
    // This handles standard markdown, code blocks (via CodeBlock component), tables, math, etc.
    // rehypeRaw allows HTML tags within markdown; rehypeSanitize cleans them up.
    // rehypeKatex handles math rendering. remarkGfm handles GitHub-flavored markdown.
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeKatex]} // Order matters: Raw -> Sanitize -> Katex
        components={markdownComponentsConfig} // Use custom component renderers
      >
        {/* ReactMarkdown expects a string child */}
        {content}
      </ReactMarkdown>
    );
  }, [message]); // Dependency array: re-run memoization if the message object changes

  // Conditional rendering for the "Edited" badge.
  // Memoization isn't strictly necessary here as it's simple JSX,
  // but it's harmless and consistent if the logic were more complex.
  const editedBadge = message.isEdited ? (
    <span className="ml-2 text-xs italic text-gray-500 dark:text-gray-400">
      (Edited
      {/* Display edited time if available */}
      {message.editedAt
        ? ` at ${new Date(message.editedAt).toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
          })}`
        : ''}
      )
    </span>
  ) : null; // Render null if not edited

  // Render the main message bubble structure
  return (
    // Container div for the message bubble, aligns left or right based on user/bot
    <div
      className={cn(
        'flex group items-start', // Added items-start for better vertical alignment
        isUser ? 'justify-end' : 'justify-start',
      )}
      role="listitem" // Appropriate ARIA role for items in a list (like a chat log)
      // ARIA live region helps screen readers announce dynamic content like typing status
      aria-live={message.status === 'sending' ? 'polite' : 'off'}
    >
      {/* AI Avatar: Shown only for bot messages */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-sm font-bold flex-shrink-0 mr-2">
          AI
        </div>
      )}
      {/* Message Bubble Content Area: Contains the text/media, status, and actions */}
      <div
        className={cn(
          'relative p-3 rounded-lg max-w-[80%] break-words', // Added break-words for long words
          isUser
            ? 'bg-primary text-primary-foreground' // User bubble styling
            : 'bg-muted text-muted-foreground', // Bot bubble styling
          // If status is error, add a visual indicator (e.g., border or background slight change)
          message.status === 'error'
            ? 'border border-red-500 bg-red-50 dark:bg-red-950'
            : '',
        )}
      >
        {/* Main Content Area: Where the markdown, JSON, etc., is rendered */}
        {/* Use a separate div for prose classes to scope markdown styling */}
        <div
          className={cn(
            'prose prose-sm max-w-none dark:prose-invert',
            'prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5',
            'prose-blockquote:my-2 prose-pre:my-2 prose-code:before:hidden prose-code:after:hidden', // Hide default markdown code backticks
            'prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:underline', // Link styling
            'prose-th:font-bold', // Table header bolding
          )}
        >
          {/* Render the memoized content */}
          {renderedContent}
          {/* Render the edited badge below the content */}
          {editedBadge}
        </div>

        {/* Status Indicator: Renders 'Typing...' or 'Error' message/retry */}
        {/* Position status below the main content */}
        <MessageStatusIndicator
          message={message}
          isUser={isUser}
          onRetry={onRetry}
        />

        {/* Action Buttons: Edit/Delete, appear on hover */}
        <MessageActions
          message={message}
          isUser={isUser}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
      {/* User Avatar: Shown only for user messages */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-user-bubble flex items-center justify-center text-user-bubble-foreground text-sm font-bold flex-shrink-0 ml-2">
          You
        </div>
      )}
    </div>
  );
}
