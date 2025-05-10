'use client';
import React from 'react';

// --- Style Imports ---
import 'katex/dist/katex.min.css'; // For math rendering
import 'prismjs/themes/prism-tomorrow.css'; // For code block syntax highlighting

// --- React and Hook Imports ---
import { useCallback, useEffect, useReducer, useRef } from 'react';

// --- Markdown and Syntax Highlighting Imports ---
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex'; // Plugin for math rendering
import rehypePrismPlus from 'rehype-prism-plus'; // Plugin for code blocks
import remarkGfm from 'remark-gfm'; // Plugin for GitHub Flavored Markdown (tables, etc.)
import remarkMath from 'remark-math'; // Plugin for math syntax

// --- Interfaces ---
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number; // Unique identifier for the message
  status?: 'sending' | 'sent' | 'error'; // Status of the message
  error?: string; // Error message if status is 'error'
  retryCount?: number; // How many times retry has been attempted
  retryLimit?: number; // Maximum number of retries allowed
  // Optional: Add personal info if needed, but handle privacy carefully
  // personalInfo?: { name: string; email: string; };
}

interface MessageBubbleProps {
  message: Message;
  onRetry?: (message: Message) => void; // Function to retry sending a message
  onDelete?: (timestamp: number) => void; // Function to delete a message
}

export interface CodeBlockProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}

type ChatState = {
  messages: Message[];
  input: string;
  isLoading: boolean; // True when waiting for AI response
  isChatOpen: boolean; // Controls visibility of the chat window
};

type ChatAction =
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'SET_INPUT'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'TOGGLE_CHAT' }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | {
      type: 'UPDATE_MESSAGE';
      payload: {
        timestamp: number;
        role: 'user' | 'assistant';
        updates: Partial<Message>;
      };
    }
  | { type: 'REMOVE_MESSAGE'; payload: number };

// --- Helper Functions ---

// Updates a specific message in the state array based on timestamp and role
const updateMessageInState = (
  messages: Message[],
  timestamp: number,
  role: 'user' | 'assistant',
  updates: Partial<Message>,
): Message[] => {
  return messages.map((msg) =>
    msg.timestamp === timestamp && msg.role === role
      ? { ...msg, ...updates }
      : msg,
  );
};

// Removes a message from the state array based on timestamp
const removeMessageFromState = (
  messages: Message[],
  timestamp: number,
): Message[] => {
  return messages.filter((msg) => msg.timestamp !== timestamp);
};

// --- Reducer ---
const initialState: ChatState = {
  messages: [],
  input: '',
  isLoading: false,
  isChatOpen: false,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'ADD_MESSAGE':
      // Avoid adding duplicates if somehow the same message object is added again
      if (
        state.messages.some(
          (m) =>
            m.timestamp === action.payload.timestamp &&
            m.role === action.payload.role,
        )
      ) {
        return state;
      }
      return { ...state, messages: [...state.messages, action.payload] };
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: updateMessageInState(
          state.messages,
          action.payload.timestamp,
          action.payload.role,
          action.payload.updates,
        ),
      };
    case 'REMOVE_MESSAGE':
      return {
        ...state,
        messages: removeMessageFromState(state.messages, action.payload),
      };
    case 'SET_INPUT':
      return { ...state, input: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'TOGGLE_CHAT':
      return { ...state, isChatOpen: !state.isChatOpen };
    default:
      // Ensure exhaustive check for action types if using TypeScript 4.9+
      // const _exhaustiveCheck: never = action;
      return state;
  }
}

// --- Main Chat Component ---
function ChatInterface() {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { messages, input, isLoading, isChatOpen } = state;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const RETRY_LIMIT = 3; // Define the retry limit

  // --- Effects ---

  // Scroll to bottom when new messages are added
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [messages.length, isChatOpen, scrollToBottom]); // Depend on messages length and chat open state

  // Load messages from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMessages = localStorage.getItem('chatMessages');
      if (savedMessages) {
        try {
          const parsedMessages: Message[] = JSON.parse(savedMessages);
          if (Array.isArray(parsedMessages)) {
            // Filter out any potentially invalid message structures during load
            const validMessages = parsedMessages.filter(
              (msg) =>
                msg &&
                typeof msg === 'object' &&
                msg.role &&
                msg.content &&
                msg.timestamp,
            );
            dispatch({ type: 'SET_MESSAGES', payload: validMessages });
          } else {
            console.warn('Invalid chat messages format found in localStorage.');
            localStorage.removeItem('chatMessages');
          }
        } catch (error) {
          console.error(
            'Failed to parse chat messages from localStorage:',
            error,
          );
          localStorage.removeItem('chatMessages');
        }
      }
    }
  }, []); // Run only once on mount

  // Save messages to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Avoid saving initial empty state unnecessarily
      if (messages.length > 0 || localStorage.getItem('chatMessages')) {
        // Filter out messages that might be in a temporary 'sending' state if desired,
        // or save all including transient states. Saving all is simpler for resuming.
        localStorage.setItem('chatMessages', JSON.stringify(messages));
      }
    }
  }, [messages]); // Run whenever messages array changes

  // --- Message Handling Logic ---
  const handleMessageSubmit = useCallback(
    async (messageOrContent: Message | string) => {
      const isRetry = typeof messageOrContent !== 'string';
      const content = isRetry ? messageOrContent.content : messageOrContent;
      const timestampToUse = isRetry ? messageOrContent.timestamp : Date.now();
      const currentRetryCount = isRetry
        ? (messageOrContent.retryCount ?? 0)
        : 0;

      if (!content.trim()) return;

      // Check retry limit
      if (isRetry && currentRetryCount >= RETRY_LIMIT) {
        console.warn(`Retry limit reached for message: ${timestampToUse}`);
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: {
            timestamp: timestampToUse,
            role: 'user',
            updates: {
              error: `Failed after ${RETRY_LIMIT} retries. Cannot send.`,
              retryCount: currentRetryCount, // Keep the count for display
            },
          },
        });
        return;
      }

      const userMessage: Message = {
        role: 'user',
        content: content.trim(),
        timestamp: timestampToUse,
        status: 'sending',
        retryCount: currentRetryCount,
        retryLimit: RETRY_LIMIT,
      };

      // --- Optimistic UI Update ---
      if (isRetry) {
        // If retrying, update the existing message's status
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: {
            timestamp: timestampToUse,
            role: 'user',
            updates: {
              status: 'sending',
              error: undefined,
              retryCount: currentRetryCount,
            },
          },
        });
      } else {
        // If new message, add it and clear input
        dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
        dispatch({ type: 'SET_INPUT', payload: '' });
      }
      dispatch({ type: 'SET_LOADING', payload: true });
      scrollToBottom(); // Scroll after adding/updating user message

      try {
        // --- Actual API Call ---
        const apiResponse = await fetch('/api/chat', {
          // Your backend endpoint
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content.trim(),
            // Send conversation history (successfully sent messages) for context
            history: messages
              .filter((msg) => msg.status === 'sent') // Only send confirmed messages
              .map(({ role, content }) => ({ role, content })), // Format for backend
          }),
        });

        // --- Handle API Response ---
        if (!apiResponse.ok) {
          const errorData = await apiResponse.json().catch(() => ({
            error: `API Error: ${apiResponse.status} ${apiResponse.statusText}`,
          }));
          throw new Error(
            errorData.error || `API Error: ${apiResponse.statusText}`,
          ); // Throw the error after attempting to parse JSON
        }

        const data = await apiResponse.json();
        const aiContent = data.reply; // Adjust based on your backend response structure

        // --- Update State on Success ---
        // 1. Update user message status to 'sent'
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: {
            timestamp: userMessage.timestamp,
            role: 'user',
            updates: { status: 'sent', error: undefined },
          },
        });

        // 2. Add the assistant's response
        const assistantMessage: Message = {
          role: 'assistant',
          content: aiContent,
          timestamp: Date.now(), // Use a new timestamp for the assistant message
          status: 'sent',
        };
        dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
      } catch (error) {
        console.error('Failed to send/process message:', error);
        // --- Update State on Error ---
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: {
            timestamp: userMessage.timestamp,
            role: 'user',
            updates: {
              status: 'error',
              error:
                error instanceof Error
                  ? error.message
                  : 'An unknown error occurred',
              retryCount: currentRetryCount + 1, // Increment retry count
            },
          },
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
        scrollToBottom(); // Scroll after potential AI response or error update
      }
    },
    [messages, scrollToBottom],
  ); // Include messages and scrollToBottom in dependencies

  // --- Delete Handler ---
  const handleDeleteMessage = useCallback((timestamp: number) => {
    dispatch({ type: 'REMOVE_MESSAGE', payload: timestamp });
  }, []);

  // --- Render ---
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Toggle Button */}
      {!isChatOpen && (
        <button
          onClick={() => dispatch({ type: 'TOGGLE_CHAT' })}
          className="p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
          aria-label="Open chat"
        >
          {/* Chat Icon */}
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.702C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isChatOpen && (
        <div className="flex flex-col w-96 max-h-[80vh] bg-white dark:bg-gray-900 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">
              AI Assistant
            </h3>
            <button
              onClick={() => dispatch({ type: 'TOGGLE_CHAT' })}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
              aria-label="Close chat"
            >
              {/* Close Icon */}
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </button>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
            {messages.map((msg) => (
              <MessageBubble
                key={`${msg.role}-${msg.timestamp}`} // More robust key
                message={msg}
                onRetry={handleMessageSubmit}
                onDelete={handleDeleteMessage}
              />
            ))}
            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg p-3 max-w-[80%] break-words shadow-sm">
                  <div className="flex items-center space-x-1.5">
                    <span
                      className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    ></span>
                    <span
                      className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    ></span>
                    <span
                      className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    ></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} /> {/* Anchor for scrolling */}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleMessageSubmit(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) =>
                  dispatch({ type: 'SET_INPUT', payload: e.target.value })
                }
                placeholder="Type your message..."
                disabled={isLoading} // Disable input while loading
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 disabled:opacity-70 disabled:cursor-not-allowed"
                aria-label="Chat input"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center h-10 w-[70px]" // Fixed width for button consistency
                aria-label="Send message"
              >
                {isLoading ? (
                  // Loading Spinner Icon
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  // Send Icon (Optional, or keep text 'Send')
                  // <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 16.571V11a1 1 0 112 0v5.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                  'Send'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Message Bubble Component ---
const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onRetry,
  onDelete,
}: Readonly<MessageBubbleProps>) => {
  const isUser = message.role === 'user';
  // Conditional styling for user vs assistant, and dark mode
  const RETRY_LIMIT = 3;
  const bubbleClass = isUser
    ? 'bg-blue-500 text-white ml-auto'
    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100';
  const containerClass = isUser ? 'flex justify-end' : 'flex justify-start';
  const canRetry =
    message.status === 'error' &&
    (message.retryCount ?? 0) < (message.retryLimit ?? RETRY_LIMIT);

  return (
    <div className={`${containerClass}`}>
      {' '}
      {/* Removed mb-4, handled by space-y in parent */}
      <div
        className={`${bubbleClass} max-w-[80%] rounded-lg p-3 break-words shadow-sm`}
      >
        {/* Error State Display */}
        {message.status === 'error' ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-red-300 dark:text-red-400 text-xs italic font-medium">
              {/* Error Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3.5 h-3.5 inline-block mr-1 align-text-bottom"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              {message.error || 'Failed to send'}
              {message.retryCount && message.retryCount > 0
                ? ` (Attempt ${message.retryCount})`
                : ''}
            </p>
            {/* Render original content slightly faded */}
            <div className="prose prose-sm max-w-none dark:prose-invert opacity-75">
              {renderMessage(message.content)}
            </div>
            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-1 border-t border-white/20 dark:border-gray-600 pt-1.5">
              {canRetry && (
                <button
                  onClick={() => onRetry?.(message)}
                  className="text-xs text-blue-200 hover:text-white dark:text-blue-300 dark:hover:text-blue-100 font-medium focus:outline-none focus:underline"
                  aria-label="Retry sending message"
                >
                  Retry
                </button>
              )}
              <button
                onClick={() => onDelete?.(message.timestamp)}
                className="text-xs text-red-300 hover:text-red-100 dark:text-red-400 dark:hover:text-red-200 font-medium focus:outline-none focus:underline"
                aria-label="Delete message"
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          // Default Message Display
          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2 prose-blockquote:my-2 prose-pre:my-2">
            {/* Render message content using Markdown */}
            {renderMessage(message.content)}
            {/* Sending Indicator (Optional) */}
            {message.status === 'sending' && (
              <span className="text-xs italic opacity-70 ml-2">
                (Sending...)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Markdown Rendering Configuration ---

// Custom renderer for code blocks (handles Mermaid and regular code)
const CodeBlock: React.FC<CodeBlockProps> = ({
  className,
  children,
  inline,
}) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  // Handle Mermaid diagrams
  // Note: Requires the Mermaid library to be loaded and initialized elsewhere (e.g., in a useEffect)
  if (!inline && language === 'mermaid') {
    return <pre className="mermaid">{String(children).trim()}</pre>;
  }

  // Handle inline code
  if (inline) {
    return (
      <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">
        {children}
      </code>
    );
  }

  // Handle regular code blocks (rehypePrismPlus handles the highlighting)
  return (
    <pre className={className}>
      <code>{children}</code>
    </pre>
  );
};

// Memoized function to render message content with Markdown
const renderMessage = (content: string) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm, remarkMath]} // Enable GitHub Flavored Markdown and Math syntax
    rehypePlugins={[
      rehypeKatex, // Render math using KaTeX
      [rehypePrismPlus, { showLineNumbers: false, ignoreMissing: true }], // Add syntax highlighting with Prism (line numbers disabled for chat)
    ]}
    components={{
      // Use custom CodeBlock component for rendering code elements
      code: CodeBlock as any, // Cast needed due to complex type inference
      // Customize other elements if needed, e.g., links to open in new tabs
      a: ({ node, ...props }) => (
        <a
          {...props}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        />
      ),
    }}
    // Disallow potentially dangerous HTML
    // rehypePlugins={[rehypeRaw]} // Use rehypeRaw carefully if you need to render raw HTML from the AI
  >
    {content}
  </ReactMarkdown>
);

// --- Export Component ---
export default ChatInterface;

// --- Add Tailwind CSS for scrollbar styling (optional, add to your global CSS or tailwind.config.js) ---
/*
@layer utilities {
  .scrollbar-thin {
    scrollbar-width: thin;
    scrollbar-color: theme('colors.gray.300') theme('colors.gray.100');
  }
  .dark .scrollbar-thin {
    scrollbar-color: theme('colors.gray.600') theme('colors.gray.800');
  }
  .scrollbar-thin::-webkit-scrollbar {
    width: 8px;
  }
  .scrollbar-thin::-webkit-scrollbar-track {
    background: theme('colors.gray.100');
    border-radius: 4px;
  }
  .dark .scrollbar-thin::-webkit-scrollbar-track {
    background: theme('colors.gray.800');
  }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: theme('colors.gray.300');
    border-radius: 4px;
    border: 2px solid theme('colors.gray.100');
  }
  .dark .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: theme('colors.gray.600');
    border: 2px solid theme('colors.gray.800');
  }
}
*/
