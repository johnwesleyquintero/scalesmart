'use client';

// --- Style Imports ---
import 'katex/dist/katex.min.css'; // For math rendering
import 'prismjs/themes/prism-tomorrow.css'; // For code block syntax highlighting

// --- React and Hook Imports ---
import { MessageBubble } from '@/components/ui/message-bubble';
import { useToast } from '@/hooks/use-toast';
import React, { useCallback, useEffect, useReducer, useRef } from 'react'; // Added React and useEffect

// --- Helper Functions ---
const scrollToBottom = () => {
  // Add a check for window existence for SSR safety, although 'use client' should handle it
  if (typeof window !== 'undefined') {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  }
};

const handleRetryLimitReached = (timestamp: number, retryCount: number) => {
  console.error(
    `Retry limit reached for message ${timestamp} after ${retryCount} attempts`,
  );
  // Optionally, inform the user via toast or message update
};

// --- Markdown and Syntax Highlighting Imports ---
// (If you add markdown rendering, imports would go here)

// --- Interfaces ---
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number; // Unique identifier for the message
  status?: 'sending' | 'sent' | 'error' | 'retrying'; // Status of the message
  error?: string; // Error message if status is 'error'
  retryCount?: number; // How many times retry has been attempted
  retryLimit?: number; // Maximum number of retries allowed
  retryStatus?: 'retrying' | 'failed'; // Visual status for retrying/failed state
}

// --- State and Reducer ---
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

// Updates a specific message in the state array based on timestamp and role
const updateMessageInState = (
  messages: Message[],
  timestamp: number,
  role: 'user' | 'assistant',
  updates: Partial<Message>,
): Message[] => {
  return messages.map((msg) =>
    // Find the specific message to update
    msg.timestamp === timestamp && msg.role === role
      ? { ...msg, ...updates } // Apply updates
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

const initialState: ChatState = {
  messages: [],
  input: '',
  isLoading: false,
  isChatOpen: false, // Start closed by default
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
      // const _exhaustiveCheck: never = action; // Uncomment for exhaustive checks
      return state;
  }
}

// --- Main Chat Component ---
const ChatInterface: React.FC = () => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { messages, input, isLoading, isChatOpen } = state;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const RETRY_LIMIT = 3;
  const RETRY_BASE_DELAY_MS = 1000; // Base delay for exponential backoff

  // Scroll to bottom effect
  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [messages, isChatOpen, isLoading]); // Trigger scroll on new messages, opening chat, or loading state change

  const applyExponentialBackoff = useCallback(
    async (currentRetryCount: number) => {
      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, currentRetryCount);
      await new Promise((resolve) => setTimeout(resolve, delay));
    },
    [],
  );

  const updateRetryingMessage = useCallback(
    (timestamp: number, currentRetryCount: number) => {
      dispatch({
        type: 'UPDATE_MESSAGE',
        payload: {
          timestamp,
          role: 'user', // Assuming only user messages are retried
          updates: {
            status: 'retrying', // Use 'retrying' status
            error: undefined,
            retryCount: currentRetryCount,
            retryStatus: 'retrying',
          },
        },
      });
    },
    [],
  );

  const handleRetryLimit = (timestamp: number, retryCount: number) => {
    handleRetryLimitReached(timestamp, retryCount);
    dispatch({
      type: 'UPDATE_MESSAGE',
      payload: {
        timestamp,
        role: 'user',
        updates: {
          status: 'error',
          retryStatus: 'failed',
        },
      },
    });
    toast('', '', {
      title: 'Retry Failed',
      description: `Message could not be sent after ${RETRY_LIMIT} attempts.`,
    });
  };

  const getMessageDetails = (messageOrContent: Message | string) => {
    const isMessage = typeof messageOrContent !== 'string';
    return {
      isMessage,
      content: isMessage ? messageOrContent.content : messageOrContent,
      timestamp: isMessage ? messageOrContent.timestamp : Date.now(),
      retryCount: isMessage ? (messageOrContent.retryCount ?? 0) : 0,
    };
  };

  const prepareUserMessage = (
    isMessage: boolean,
    content: string,
    retryCount: number,
    timestamp: number,
    isRetry: boolean,
  ): Message => {
    return {
      role: 'user',
      content: content.trim(),
      timestamp: timestamp,
      status: isRetry ? 'retrying' : 'sending',
      retryCount: isRetry ? retryCount : 0,
    };
  };

  const handleApiResponse = async (response: Response) => {
    // Clone the response to allow multiple reads of the body stream
    const responseClone = response.clone();

    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await responseClone.json();
        errorMessage = errorData.error || errorMessage;
        if (errorData.details) errorMessage += ` (${errorData.details})`;

        // Log additional error details for debugging
        console.error('API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          requestUrl: response.url,
          timestamp: Date.now(),
        });
      } catch (parseError) {
        console.error('Failed to parse error JSON:', {
          parseError,
          responseText: await responseClone.text(),
          status: response.status,
          statusText: response.statusText,
          timestamp: Date.now(),
        });
      }
      throw new Error(errorMessage);
    }

    // Clone the response before reading to avoid stream consumption
    const responseCloneForSuccess = response.clone();
    return await responseCloneForSuccess.json();
  };

  const updateMessageOnSuccess = (
    timestampToUse: number,
    aiContent: string,
  ) => {
    dispatch({
      type: 'UPDATE_MESSAGE',
      payload: {
        timestamp: timestampToUse,
        role: 'user',
        updates: {
          status: 'sent',
          error: undefined,
          retryStatus: undefined,
        },
      },
    });

    const assistantMessage: Message = {
      role: 'assistant',
      content: aiContent,
      timestamp: Date.now(),
      status: 'sent',
    };
    dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
  };

  const updateMessageOnError = (
    error: unknown,
    timestampToUse: number,
    currentRetryCount: number,
  ) => {
    const nextRetryCount = currentRetryCount + 1;
    const isFailed = nextRetryCount >= RETRY_LIMIT;

    dispatch({
      type: 'UPDATE_MESSAGE',
      payload: {
        timestamp: timestampToUse,
        role: 'user',
        updates: {
          status: 'error',
          error:
            error instanceof Error
              ? error.message
              : 'An unknown error occurred',
          retryCount: nextRetryCount,
          retryStatus: isFailed ? 'failed' : undefined,
        },
      },
    });

    if (!isFailed) {
      toast('', '', {
        title: 'Message Failed',
        description: `Attempt ${currentRetryCount + 1} failed. Retrying... (${error instanceof Error ? error.message : 'Unknown error'})`,
      });
    }
  };

  const handleMessageSubmit = useCallback(
    async (messageOrContent: Message | string) => {
      const { isMessage, content, timestamp, retryCount } =
        getMessageDetails(messageOrContent);

      if (!content.trim()) return;

      if (isMessage && retryCount >= RETRY_LIMIT) {
        handleRetryLimit(timestamp, retryCount);
        return;
      }

      const isRetry = isMessage && retryCount > 0;
      const currentRetryCount = isRetry ? retryCount : 0;
      const timestampToUse = timestamp;

      if (isRetry) {
        await applyExponentialBackoff(currentRetryCount);
        updateRetryingMessage(timestampToUse, currentRetryCount);
      }

      const userMessage = prepareUserMessage(
        isMessage,
        content,
        retryCount,
        timestampToUse,
        isRetry,
      );

      if (!isRetry) {
        dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
        dispatch({ type: 'SET_INPUT', payload: '' });
      }

      dispatch({ type: 'SET_LOADING', payload: true });

      try {
        console.log('Submitting message to /api/chat:', {
          content: content.trim(),
          history: messages
            .filter((msg) => msg.status === 'sent')
            .map(({ role, content }) => ({ role, content })),
        });

        const apiResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content.trim(),
            history: messages
              .filter((msg) => msg.status === 'sent')
              .map(({ role, content }) => ({ role, content })),
          }),
        });

        console.log('API response status:', apiResponse.status);
        const data = await handleApiResponse(apiResponse);
        updateMessageOnSuccess(timestampToUse, data.response);
      } catch (error) {
        console.error('Failed to send/process message:', error);
        updateMessageOnError(error, timestampToUse, currentRetryCount);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [messages, toast, applyExponentialBackoff, updateRetryingMessage, dispatch],
  );

  // --- Delete Handler ---
  const handleDeleteMessage = useCallback(
    (timestamp: number) => {
      dispatch({ type: 'REMOVE_MESSAGE', payload: timestamp });
    },
    [dispatch], // Added dispatch dependency
  );

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
                key={`${msg.role}-${msg.timestamp}`} // Use timestamp as primary key part
                message={msg}
                onRetry={handleMessageSubmit}
                onDelete={handleDeleteMessage}
              />
            ))}
            {/* Typing Indicator */}
            {isLoading &&
              messages.length > 0 && // Ensure there are messages before checking the last one
              messages[messages.length - 1]?.role === 'user' &&
              messages[messages.length - 1]?.status !== 'error' && ( // Don't show typing if user message failed
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
            {/* Corrected: Form should wrap input and button */}
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
                disabled={isLoading}
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 disabled:opacity-70 disabled:cursor-not-allowed"
                aria-label="Chat input"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center h-10 w-[70px]" // Fixed width
                aria-label="Send message"
              >
                {/* Corrected: Conditional rendering inside button */}
                {isLoading ? (
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
                  'Send'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Ensure only one default export
export default ChatInterface;

// Removed duplicate definitions below this line
