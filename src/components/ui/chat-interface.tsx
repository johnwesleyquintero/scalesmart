'use client';
import { RETRY_LIMIT as ConfigRetryLimit } from '@/lib/config';
import DOMPurify from 'dompurify';
import React, { useCallback, useEffect, useReducer, useRef } from 'react';

// --- Style Imports ---
import 'katex/dist/katex.min.css'; // For math rendering
import 'prismjs/themes/prism-tomorrow.css'; // For code block syntax highlighting

// --- React and Hook Imports ---
import type { Element as HastElement } from 'hast';
import type { JSX } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypePrismPlus from 'rehype-prism-plus';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

// --- Component Imports ---
import { RotateCcw, Trash2 } from 'lucide-react';
import CopyMarkdownButton from './CopyMarkdownButton';

// --- Interfaces ---
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number; // Unique identifier for the message
  status?: 'sending' | 'sent' | 'error'; // Status of the message
  error?: string; // Error message if status is 'error'
  retryCount?: number; // How many times retry has been attempted
  retryLimit?: number; // Maximum number of retries allowed
  id?: string; // Unique identifier for the message
}

interface MessageBubbleProps {
  message: Message;
  onRetry?: (message: Message) => void;
  onDelete?: (timestamp: number) => void;
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
export const initialState: ChatState = {
  messages: [],
  input: '',
  isLoading: false,
  isChatOpen: false,
};

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
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
      {
        const newMessage = action.payload.id
          ? action.payload
          : { ...action.payload, id: crypto.randomUUID() };
        return { ...state, messages: [...state.messages, newMessage] };
      }
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
export default function ChatInterface() {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { messages, input, isLoading, isChatOpen } = state;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Effects ---

  // Scroll to bottom when new messages are added
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [messages]); // Depend on messages

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
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'An unknown error occurred';
          console.error(
            'Failed to parse chat messages from localStorage:',
            errorMessage,
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
        localStorage.setItem('chatMessages', JSON.stringify(messages));
      }
    }
  }, [messages]); // Run whenever messages array changes

  // Send initial greeting if chat is opened and empty
  useEffect(() => {
    if (isChatOpen && messages.length === 0 && !isLoading) {
      // Check if a greeting hasn't ALREADY been added in this session/load
      const hasGreetingAlready = messages.some(
        (msg) =>
          msg.role === 'assistant' &&
          msg.content.startsWith("Hey there! I'm Wesley."), // Updated check
      );

      if (!hasGreetingAlready) {
        const greetingMessage: Message = {
          role: 'assistant',
          content:
            "Hey there! I'm Wesley. Thanks for stopping by my digital space. Feel free to ask me about:\n\n" +
            "- My latest projects and what I'm working on.\n" +
            '- My core skills and expertise in Amazon & e-commerce.\n' +
            '- How to get in touch for collaborations or inquiries.\n\n' +
            'What can I help you with today?',
          timestamp: Date.now(),
          status: 'sent',
        };
        dispatch({ type: 'ADD_MESSAGE', payload: greetingMessage });
      }
    }
  }, [isChatOpen, messages, isLoading]); // Re-run if chat opens, messages change, or loading state changes

  // --- Message Handling Logic ---
  const getRetryLimit = (messageOrContent: Message | string): number => {
    return typeof messageOrContent === 'string'
      ? 3
      : (messageOrContent.retryLimit ?? 3);
  };

  const sendMessage = useCallback(
    async (
      message: Message,
      isRetry: boolean,
      timestampToUse: number,
      currentRetryCount: number,
    ) => {
      const RETRY_LIMIT = message.retryLimit ?? ConfigRetryLimit ?? 3;
      // Sanitize the message content before sending
      const sanitizedContent = DOMPurify.sanitize(message.content);
      try {
        // --- Actual API Call ---
        console.log('Calling /api/chat with message:', sanitizedContent);
        const apiResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: sanitizedContent.trim(),
            history: messages
              .filter((msg) => msg.status === 'sent')
              .map(({ role, content }) => ({ role, content })),
          }),
        });

        // --- Handle API Response ---
        console.log('API Response:', apiResponse);
        if (!apiResponse.ok) {
          let errorData;
          try {
            errorData = await apiResponse.json();
          } catch (jsonError) {
            console.error('Failed to parse JSON error response:', jsonError);
            throw new Error(
              `API Error: ${apiResponse.status} ${apiResponse.statusText}. Failed to parse JSON response.`,
            );
          }
          console.error('API Error Data:', errorData);
          const errorMessage =
            errorData?.error ||
            `API Error: ${apiResponse.status} ${apiResponse.statusText}`;
          throw new Error(errorMessage);
        }

        const data = await apiResponse.json();
        console.log('API Data:', data); // Log the parsed JSON data
        const aiContent = data?.response; // Changed 'reply' to 'response' to match backend
        console.log('AI Reply Content:', aiContent);

        // 1. Update user message status to 'sent' since the API request itself was successful
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: {
            timestamp: message.timestamp,
            role: 'user',
            updates: { status: 'sent', error: undefined },
          },
        });

        // 2. Add the assistant's response or an error message if content is invalid
        if (typeof aiContent === 'string' && aiContent.trim() !== '') {
          const assistantMessage: Message = {
            role: 'assistant',
            content: aiContent,
            timestamp: Date.now(),
            status: 'sent',
          };
          dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
        } else {
          console.error(
            'AI Reply Content is empty, undefined, or not a string. API Data:',
            data,
          );
          const assistantErrorMessage: Message = {
            role: 'assistant',
            content:
              "Sorry, I couldn't fetch a valid response. Please try again or rephrase your question.",
            timestamp: Date.now(),
            status: 'sent', // Display as a normal assistant message, its content is the error.
          };
          dispatch({ type: 'ADD_MESSAGE', payload: assistantErrorMessage });
        }
      } catch (error: unknown) {
        console.error('Failed to send/process message:', error);
        // --- Retry Mechanism with Exponential Backoff ---
        const retryCount = currentRetryCount + 1;
        if (retryCount <= RETRY_LIMIT) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          console.log(
            `Retrying message (attempt ${retryCount}/${RETRY_LIMIT}) in ${
              delay / 1000
            } seconds...`,
          );
          setTimeout(() => {
            sendMessage(message, true, timestampToUse, retryCount); // Recursive call for retry
          }, delay);
        } else {
          // --- Update State on Error After Retries Exhausted ---
          console.warn(`Max retries reached for message: ${message.timestamp}`);
          dispatch({
            type: 'UPDATE_MESSAGE',
            payload: {
              timestamp: message.timestamp,
              role: 'user',
              updates: {
                status: 'error',
                error:
                  error instanceof Error
                    ? `Failed after ${RETRY_LIMIT} retries: ${error.message}`
                    : `Failed after ${RETRY_LIMIT} retries: An unknown error occurred`,
                retryCount: retryCount,
              },
            },
          });
        }
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
        scrollToBottom();
      }
    },
    [messages, scrollToBottom, dispatch],
  );

  const handleMessageSubmit = useCallback(
    async (messageOrContent: Message | string) => {
      const isRetry = typeof messageOrContent !== 'string';
      const content = isRetry ? messageOrContent.content : messageOrContent;
      const timestampToUse = isRetry ? messageOrContent.timestamp : Date.now();
      const currentRetryCount = isRetry
        ? (messageOrContent.retryCount ?? 0)
        : 0;
      const RETRY_LIMIT = getRetryLimit(messageOrContent);

      if (!content?.trim()) return;

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
      console.log('Submitting message:', content); // Log the message content

      await sendMessage(
        userMessage,
        isRetry,
        timestampToUse,
        currentRetryCount,
      );
    },
    [messages, scrollToBottom, dispatch, sendMessage],
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
              Chat with Wesley
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
                />
              </svg>
            </button>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
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
  const bubbleClass = isUser
    ? 'bg-blue-500 text-white ml-auto'
    : // Assistant bubble needs to be relative for absolute positioning of copy button
      'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100';
  const containerClass = isUser ? 'flex justify-end' : 'flex justify-start';
  const canRetry =
    message.status === 'error' &&
    (message.retryCount ?? 0) < (message.retryLimit ?? ConfigRetryLimit);

  return (
    <div className={`${containerClass} group relative`}>
      {' '}
      {/* Added group and relative for copy button */}{' '}
      {/* Removed mb-4, handled by space-y in parent */}
      <div
        className={`${bubbleClass} max-w-[80%] rounded-lg p-3 break-words shadow-sm`}
      >
        {/* Copy Button for Assistant Messages */}
        {!isUser && message.status === 'sent' && (
          <CopyMarkdownButton content={message.content} />
        )}

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
                  {' '}
                  <RotateCcw className="w-3 h-3 inline-block mr-1" /> Retry
                </button>
              )}
              <button
                onClick={() => onDelete?.(message.timestamp)}
                className="text-xs text-red-300 hover:text-red-100 dark:text-red-400 dark:hover:text-red-200 font-medium focus:outline-none focus:underline"
                aria-label="Delete message"
              >
                <Trash2 className="w-3 h-3 inline-block mr-1" /> Delete
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
import { FC } from 'react';

interface CodeBlockProps {
  node?: HastElement;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

// Custom renderer for code blocks (handles Mermaid, HTML, and regular code)
const CodeBlock: FC<CodeBlockProps> = ({ inline, className, children }) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match?.[1];
  const codeContent = String(children).replace(/\n$/, '');

  if (inline) {
    return <code className={className}>{codeContent}</code>;
  }

  if (language === 'mermaid') {
    return (
      <div className="mermaid-container my-4 overflow-x-auto bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
        <pre className={className}>
          <code>{codeContent}</code>
        </pre>
      </div>
    );
  }

  if (language === 'html' || language === 'markup') {
    return (
      <div className="code-block-wrapper group/codeblock relative my-4">
        <pre className={className}>
          <code className={`language-${language}`}>{codeContent}</code>
        </pre>
      </div>
    );
  }

  // Standard code block
  return (
    <div className="code-block-wrapper group/codeblock relative my-4">
      <pre className={className}>
        <code className={`language-${language}`}>{codeContent}</code>
      </pre>
    </div>
  );
};

const renderMessage = (content: string): JSX.Element => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm, remarkMath]}
    rehypePlugins={[
      rehypeKatex,
      [rehypePrismPlus, { ignoreMissing: true, defaultLanguage: 'plaintext' }],
    ]}
    components={{
      code: CodeBlock,
    }}
  >
    {content}
  </ReactMarkdown>
);
