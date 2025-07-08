// React and Hooks
import React, { useMemo } from 'react';
// Using React.HTMLAttributes<HTMLElement> directly might be clearer than PropsWithChildren & HTMLAttributes<HTMLElement>
import type { HTMLAttributes } from 'react';

// Third-party Libraries
import { RotateCcw, Trash2, Edit, Clipboard } from 'lucide-react'; // Import Edit and Clipboard icons

// Local Utilities and Components
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button'; // Assuming this is a local Button component
import MessageContent from './MessageContent'; // Import the new MessageContent component

// Types
import { Message } from '@/lib/chat-message-utils';

interface MessageBubbleProps extends HTMLAttributes<HTMLDivElement> {
  message: Message;
  onRetry?: (content: string, message: Message) => void;
  onDelete: (timestamp: number) => void;
  onEdit?: (message: Message) => void;
  onPromptClick?: (promptText: string) => void;
}

interface MessageStatusIndicatorProps {
  message: Message;
  isUser: boolean;
  onRetry?: (content: string, message: Message) => void; // Matches MessageBubbleProps signature
}

/**
 * Renders message status indicators (Typing, Error).
 * Handles retry logic for failed user messages.
 */
/**
 * Simple component for the typing animation.
 */
function TypingIndicator() {
  return (
    <div className="typing-indicator ml-2 text-xs opacity-70 flex items-center space-x-0.5">
      <span>•</span>
      <span>•</span>
      <span>•</span>
    </div>
  );
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
    return <TypingIndicator />;
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
            onClick={() => onRetry?.(message.content, message)}
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
  onEdit?: (message: Message) => void; // Matches MessageBubbleProps signature
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

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    // You might want to add a toast notification here to confirm the copy
  };

  return (
    // Position actions absolutely, hide by default and show on parent group hover
    <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
      {' '}
      {/* Added z-index */}
      {/* Copy Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        aria-label="Copy message"
        title="Copy"
        className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
      >
        <Clipboard className="w-3 h-3" />
      </Button>
      {/* Edit Button: Only for sent user messages */}
      {isUser && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit?.(message)}
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
        // Added text color classes
        className="text-red-400 hover:text-red-500 dark:text-red-500 dark:hover:text-red-400"
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
    return <MessageContent content={message.content} />;
  }, [message.content]); // Dependency array: re-run memoization if the message content changes

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
            ? 'bg-blue-600 text-white dark:bg-blue-700' // User bubble styling with improved contrast
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
        </div>
        <div className="flex items-center justify-end mt-1 text-xs text-gray-400 dark:text-gray-500">
          {editedBadge}
          <span>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </span>
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
