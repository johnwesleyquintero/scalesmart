'use client';
import { RETRY_LIMIT as ConfigRetryLimit } from '@/lib/config';
import DOMPurify from 'dompurify';
import React, { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  initializeDB,
  setItem,
  getChatMessagesBySession,
  ChatMessageRecord,
} from '@/lib/indexeddb-service';

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
import { RotateCcw, Trash2, Maximize, Minimize } from 'lucide-react';
import CopyMarkdownButton from './CopyMarkdownButton';
import HtmlPreview from './HtmlPreview'; // Import the new HtmlPreview component
import JsonViewer from './JsonViewer'; // Import the new JsonViewer component
import MermaidDiagram from './MermaidDiagram'; // Import the MermaidDiagram component
import { toString as hastToString } from 'hast-util-to-string'; // For extracting raw code
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils'; // For conditional class names

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
  isGreeting?: boolean; // Flag for the initial greeting message
}

interface MessageBubbleProps {
  message: Message;
  onRetry?: (message: Message) => void;
  onDelete?: (timestamp: number) => void;
  onPromptClick?: (promptText: string) => void; // For "Prompts to Try"
}

type ChatState = {
  messages: Message[];
  input: string;
  isLoading: boolean; // True when waiting for AI response
  isChatOpen: boolean; // Controls visibility of the chat window
  isFullScreen: boolean; // New state for fullscreen mode
};

type ChatAction =
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'SET_INPUT'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'TOGGLE_CHAT' }
  | { type: 'TOGGLE_FULLSCREEN' }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | {
      type: 'UPDATE_MESSAGE';
      payload: {
        timestamp: number;
        role: 'user' | 'assistant';
        updates: Partial<Message>;
      };
    }
  | { type: 'REMOVE_MESSAGE'; payload: number }
  | { type: 'CLEAR_MESSAGES' };

// --- Helper Functions ---

// Maps the Message['role'] to the sender type expected by the database.
const mapMessageRoleToSender = (role: Message['role']): 'user' | 'ai' => {
  if (role === 'assistant') {
    return 'ai';
  }
  return 'user'; // If not 'assistant', it must be 'user' based on Message['role']
};

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
  isFullScreen: false, // Initialize to false
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
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] };
    case 'SET_INPUT':
      return { ...state, input: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'TOGGLE_CHAT':
      // When toggling chat visibility, ensure fullscreen is reset if chat is closing
      return {
        ...state,
        isChatOpen: !state.isChatOpen,
        isFullScreen: !state.isChatOpen ? false : state.isFullScreen,
      };
    case 'TOGGLE_FULLSCREEN':
      return { ...state, isFullScreen: !state.isFullScreen };
    default:
      // Ensure exhaustive check for action types if using TypeScript 4.9+
      // const _exhaustiveCheck: never = action;
      return state;
  }
}

// --- Constants ---
const DEFAULT_RETRY_LIMIT = 3;

// --- Pure Helper Functions (can be outside the component) ---

// Parses an error response from the API
async function parseApiErrorResponse(apiResponse: Response): Promise<string> {
  let errorResponseMessage = `API Error: ${apiResponse.status} ${apiResponse.statusText}`;
  let rawErrorResponse = '';

  try {
    rawErrorResponse = await apiResponse.text();
    if (rawErrorResponse) {
      try {
        const errorData = JSON.parse(rawErrorResponse);
        // console.debug('Parsed API Error Data:', errorData); // Optional: for debugging

        if (
          errorData &&
          typeof errorData.error === 'string' &&
          errorData.error.trim() !== ''
        ) {
          errorResponseMessage = errorData.error;
        } else if (
          rawErrorResponse.trim() !== '' &&
          rawErrorResponse.trim() !== '{}'
        ) {
          const Suffix = '... (response truncated)';
          const MaxLength = 200;
          errorResponseMessage = `Server Error ${apiResponse.status}: ${rawErrorResponse.substring(0, MaxLength)}${rawErrorResponse.length > MaxLength ? Suffix : ''}`;
        }
      } catch (jsonParseError) {
        // console.warn('Failed to parse API error response as JSON. Raw response:', rawErrorResponse.substring(0, 500)); // Optional: for debugging
        const Suffix = '... (response truncated)';
        const MaxLength = 200;
        errorResponseMessage = `Server Error ${apiResponse.status}: ${rawErrorResponse.substring(0, MaxLength)}${rawErrorResponse.length > MaxLength ? Suffix : ''}`;
      }
    }
  } catch (textReadError) {
    console.error('Failed to read API error response as text:', textReadError);
  }
  return errorResponseMessage;
}

// --- Types and Helpers for AI Content Processing ---
interface ContentBlock {
  type: string;
  content: string;
  language?: string;
}

// For objects like { html: "...", css: "..." } or any other object
interface OtherObjectContent {
  html?: string;
  css?: string;
  javascript?: string;
  json?: string;
  [key: string]: unknown; // Allows any other properties, safer than 'any'
}

type ArrayItemType = string | ContentBlock | OtherObjectContent;

type AiContentRaw =
  | string
  | ContentBlock
  | OtherObjectContent
  | Array<ArrayItemType>
  | null
  | undefined;

// Fetches chat response and processes it into a success or error object
async function fetchAndProcessChatApi(
  sanitizedContent: string,
  currentMessages: Message[],
): Promise<
  { type: 'success'; data: Message } | { type: 'error'; message: string }
> {
  console.log('Calling /api/chat with message:', sanitizedContent);
  console.time('Fetch /api/chat');
  try {
    const apiResponse = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: sanitizedContent.trim(),
        history: currentMessages
          .filter((msg) => msg.status === 'sent')
          .map(({ role, content }) => ({ role, content })),
      }),
      cache: 'no-store',
    });
    console.timeEnd('Fetch /api/chat');
    console.log('API Response:', apiResponse);
    // console.log('API Response Status:', apiResponse.status); // Keep this concise for now

    if (!apiResponse.ok) {
      const errorMessage = await parseApiErrorResponse(apiResponse);
      return { type: 'error', message: errorMessage };
    }

    const data = await apiResponse.json();
    console.log('API Data:', data);
    console.log('Raw API Data (data.response):', data?.response); // Log the raw response part

    const aiContentRaw = data?.response; // This could be string, array, or object

    const aiContent = processAiContentRaw(aiContentRaw);
    console.log('Processed aiContent before sending to UI:', aiContent); // Log the processed content

    if (aiContentRaw === null || typeof aiContentRaw === 'undefined') {
      console.warn(
        'AI Reply Content (data.response) was null or undefined, defaulting to empty string. API Data:',
        data,
      );
    }

    if (aiContent.trim() !== '') {
      return {
        type: 'success',
        data: {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: aiContent, // Ensure this is always a string
          timestamp: Date.now(),
          status: 'sent',
        },
      };
    } else {
      console.error(
        'AI Reply Content is invalid or empty after processing. API Data:',
        data,
      );
      return {
        type: 'success',
        data: {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            "Sorry, I couldn't fetch a valid response. Please try again.",
          timestamp: Date.now(),
          status: 'sent',
        },
      };
    }
  } catch (error) {
    // Catches network errors or issues with fetch/json itself
    console.error('Error in fetchAndProcessChatApi:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'An unknown network error occurred.';
    return { type: 'error', message };
  }
}

// --- AI Content Processing Helper Functions ---

// Helper for single ContentBlock
function processSingleContentBlock(block: ContentBlock): string {
  switch (block.type) {
    case 'html':
      return `\`\`\`html\n${block.content}\n\`\`\``;
    case 'css':
      return `\`\`\`css\n${block.content}\n\`\`\``;
    case 'javascript':
      return `\`\`\`javascript\n${block.content}\n\`\`\``;
    case 'code':
      return `\`\`\`${block.language || 'plaintext'}\n${block.content}\n\`\`\``;
    case 'json':
      return `\`\`\`json\n${block.content}\n\`\`\``;
    default:
      return `\`\`\`json\n${JSON.stringify(block, null, 2)}\n\`\`\``;
  }
}

// Helper for OtherObjectContent
function processOtherObjectContent(obj: OtherObjectContent): string {
  if (typeof obj.html === 'string') return `\`\`\`html\n${obj.html}\n\`\`\``;
  if (typeof obj.css === 'string') return `\`\`\`css\n${obj.css}\n\`\`\``;
  if (typeof obj.javascript === 'string')
    return `\`\`\`javascript\n${obj.javascript}\n\`\`\``;
  if (typeof obj.json === 'string') return `\`\`\`json\n${obj.json}\n\`\`\``;
  // Fallback for any other object, treat as JSON
  return `\`\`\`json\n${JSON.stringify(obj, null, 2)}\n\`\`\``;
}

// Type guard for ContentBlock
function isContentBlock(item: unknown): item is ContentBlock {
  return (
    typeof item === 'object' &&
    item !== null &&
    'type' in item &&
    'content' in item
  );
}

const processAiContentRaw = (rawContent: AiContentRaw): string => {
  if (typeof rawContent === 'string') {
    return rawContent;
  }
  if (rawContent === null || typeof rawContent === 'undefined') {
    // Specific console.warn with API data is handled in the calling function (fetchAndProcessChatApi)
    // This function only knows about rawContent.
    console.warn(
      'processAiContentRaw received null or undefined, defaulting to empty string.',
    );
    return '';
  }

  if (Array.isArray(rawContent)) {
    return rawContent
      .map((item: ArrayItemType) => {
        if (typeof item === 'string') return item;
        if (isContentBlock(item)) {
          return processSingleContentBlock(item);
        }
        if (typeof item === 'object' && item !== null) {
          return processOtherObjectContent(item);
        }
        return String(item);
      })
      .join('\n\n');
  }

  if (isContentBlock(rawContent)) {
    return processSingleContentBlock(rawContent);
  }
  if (typeof rawContent === 'object' && rawContent !== null) {
    return processOtherObjectContent(rawContent);
  }
  return String(rawContent);
};

// --- Main Chat Component ---
export default function ChatInterface() {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { messages, input, isLoading, isChatOpen, isFullScreen } = state;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- Helper Functions ---

  // Maps a ChatMessageRecord from the DB to the Message interface used in the UI
  const mapDbRecordToMessage = (record: ChatMessageRecord): Message => {
    return {
      id: record.id?.toString(), // Dexie ID is number, UI might expect string
      role: record.sender === 'ai' ? 'assistant' : 'user', // Map 'ai' to 'assistant', 'user' to 'user'
      content: record.text,
      timestamp: record.timestamp,
      // Map other fields from record.metadata if necessary
      // e.g., status: record.metadata?.status as Message['status'],
    };
  };

  // --- Helper Functions ---

  // Maps the Message['role'] to the sender type expected by the database.

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
      textareaRef.current?.focus(); // Focus the textarea when chat opens
    }
  }, [messages, isChatOpen, scrollToBottom]); // Depend on messages, isChatOpen, and scrollToBottom

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height to recalculate
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]); // Depend on input to resize as text is typed

  // Generate a unique session ID for this chat session
  const chatSessionIdRef = useRef<string>(crypto.randomUUID());

  // Function to reset chat (clear messages and generate new session ID)
  const resetChat = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' });
    chatSessionIdRef.current = crypto.randomUUID(); // Generate a new session ID
    console.log('Chat reset. New session ID:', chatSessionIdRef.current);
  }, [dispatch]);

  // Load messages from IndexedDB when the component mounts or session ID changes
  useEffect(() => {
    const loadMessages = async () => {
      console.log('ChatInterface: Attempting to load messages from IndexedDB.');
      try {
        await initializeDB(); // Ensure the Dexie db instance is open and ready
        console.log('ChatInterface: initializeDB completed.');

        const dbMessages = await getChatMessagesBySession(
          chatSessionIdRef.current,
        );
        console.log('ChatInterface: Fetched messages from DB:', dbMessages);

        const uiMessages = dbMessages.map(mapDbRecordToMessage);
        dispatch({ type: 'SET_MESSAGES', payload: uiMessages });
        console.log(
          'Chat messages loaded from IndexedDB and mapped to UI format.',
        );
      } catch (error) {
        console.error('ChatInterface: Error in loadMessages:', error);
      }
    };
    loadMessages();
  }, [chatSessionIdRef.current]); // Re-run when session ID changes

  // Save messages to IndexedDB when they change
  useEffect(() => {
    const saveMessages = async () => {
      if (typeof window !== 'undefined') {
        console.log('ChatInterface: Attempting to save messages to IndexedDB.');
        for (const message of messages) {
          try {
            const messageDataPayload = {
              id: message.id!,
              sender: mapMessageRoleToSender(message.role),
              text: message.content,
              timestamp: message.timestamp,
              // Potential future enhancement: store message.status, .error, .retryCount in metadata
            };
            await setItem(chatSessionIdRef.current, messageDataPayload);
          } catch (error) {
            console.error(
              `ChatInterface: Failed to save message ${message.id} to IndexedDB:`,
              error,
            );
          }
        }
        console.log('ChatInterface: Messages saved to IndexedDB.');
      }
    };
    // Only run saveMessages if there are messages to save, to avoid issues on clear or initial load.
    if (messages.length > 0) {
      saveMessages();
    }
  }, [messages, chatSessionIdRef.current]); // Run whenever messages array or session ID changes

  // Send initial greeting if chat is opened and empty
  useEffect(() => {
    if (isChatOpen && messages.length === 0 && !isLoading) {
      // Check if a greeting hasn't ALREADY been added in this session/load
      const hasGreetingAlready = messages.some((msg) => msg.isGreeting);

      if (!hasGreetingAlready) {
        const greetingMessage: Message = {
          role: 'assistant',
          content:
            "Hey there! I'm WesAI.\n\n" +
            'I can turn your raw data into insights! or try one of these prompts:',
          timestamp: Date.now(),
          status: 'sent',
          isGreeting: true, // Mark this as the greeting message
        };
        dispatch({ type: 'ADD_MESSAGE', payload: greetingMessage });
      }
    }
  }, [isChatOpen, messages, isLoading, dispatch]); // Re-run if chat opens, messages change, or loading state changes

  // --- Message Handling Logic ---
  // Helper to determine the effective retry limit for a message
  const determineEffectiveRetryLimit = useCallback(
    (message?: Message): number => {
      if (message && typeof message.retryLimit === 'number') {
        return message.retryLimit;
      }
      return ConfigRetryLimit ?? DEFAULT_RETRY_LIMIT;
    },
    [ConfigRetryLimit],
  ); // Include DEFAULT_RETRY_LIMIT if it were a prop/state

  const sendMessage = useCallback(
    async (
      userMessage: Message, // Full message object, includes timestamp, content, id, etc.
      currentRetryCount: number,
    ) => {
      const effectiveRetryLimit = determineEffectiveRetryLimit(userMessage);
      // Sanitize the message content before sending
      const sanitizedContent = DOMPurify.sanitize(userMessage.content);

      try {
        const result = await fetchAndProcessChatApi(sanitizedContent, messages);

        if (result.type === 'success') {
          // API call was successful, and we got a response (even if it's an error message from AI)
          dispatch({
            type: 'UPDATE_MESSAGE',
            payload: {
              timestamp: userMessage.timestamp,
              role: 'user',
              updates: {
                status: 'sent',
                error: undefined,
                retryCount: currentRetryCount,
              },
            },
          });
          dispatch({ type: 'ADD_MESSAGE', payload: result.data }); // result.data is already a Message
        } else {
          // result.type === 'error' - API call itself failed
          console.error(
            `API call failed for message ${userMessage.timestamp}: ${result.message}`,
          );
          const nextRetryCount = currentRetryCount + 1;

          if (nextRetryCount <= effectiveRetryLimit) {
            const delay = Math.pow(2, nextRetryCount) * 1000; // Exponential backoff
            console.log(
              `Retrying message ${userMessage.timestamp} (attempt ${nextRetryCount}/${effectiveRetryLimit}) in ${delay / 1000}s. Error: ${result.message}`,
            );
            // Update UI to show retrying status
            dispatch({
              type: 'UPDATE_MESSAGE',
              payload: {
                timestamp: userMessage.timestamp,
                role: 'user',
                updates: {
                  status: 'sending', // Keep as 'sending' or use a dedicated 'retrying' status
                  error: `Retry ${nextRetryCount}/${effectiveRetryLimit}: ${result.message}`,
                  retryCount: nextRetryCount,
                },
              },
            });
            // Schedule retry
            setTimeout(() => {
              sendMessage(userMessage, nextRetryCount); // Recursive call for retry
            }, delay);
            // Return here to prevent `finally` from setting isLoading to false if a retry is scheduled
            return;
          } else {
            // Max retries reached
            console.warn(
              `Max retries (${effectiveRetryLimit}) reached for message: ${userMessage.timestamp}. Final error: ${result.message}`,
            );
            dispatch({
              type: 'UPDATE_MESSAGE',
              payload: {
                timestamp: userMessage.timestamp,
                role: 'user',
                updates: {
                  status: 'error',
                  error: `Failed after ${effectiveRetryLimit} retries: ${result.message}`,
                  retryCount: currentRetryCount, // Show the count at which it failed
                },
              },
            });
          }
        }
      } catch (unexpectedError) {
        // This catch is for unexpected errors within this sendMessage logic itself,
        // not for API errors which are handled by fetchAndProcessChatApi.
        console.error(
          'Unexpected error in sendMessage logic:',
          unexpectedError,
        );
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: {
            timestamp: userMessage.timestamp,
            role: 'user',
            updates: {
              status: 'error',
              error:
                unexpectedError instanceof Error
                  ? unexpectedError.message
                  : 'A critical internal error occurred.',
              retryCount: currentRetryCount,
            },
          },
        });
      } finally {
        // This block executes if the try block completes or if an error is caught and not returned from.
        // If a retry is scheduled, the function returns early, and this finally block is skipped for that call.
        dispatch({ type: 'SET_LOADING', payload: false });
        scrollToBottom();
      }
    },
    [messages, scrollToBottom, dispatch, ConfigRetryLimit],
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      dispatch({ type: 'SET_INPUT', payload: e.target.value });
    },
    [dispatch],
  );

  const handleMessageSubmit = useCallback(
    async (messageOrContent: Message | string) => {
      const isRetry = typeof messageOrContent !== 'string';
      const content = isRetry ? messageOrContent.content : messageOrContent;
      const timestampToUse = isRetry ? messageOrContent.timestamp : Date.now();
      const initialRetryCountForCall = isRetry
        ? (messageOrContent.retryCount ?? 0)
        : 0;
      const effectiveRetryLimit = determineEffectiveRetryLimit(
        isRetry ? messageOrContent : undefined,
      );

      if (!content?.trim()) return;

      // Check retry limit
      if (isRetry && initialRetryCountForCall >= effectiveRetryLimit) {
        console.warn(`Retry limit reached for message: ${timestampToUse}`);
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: {
            timestamp: timestampToUse,
            role: 'user',
            updates: {
              error: `Failed after ${effectiveRetryLimit} retries. Cannot send.`,
              retryCount: initialRetryCountForCall,
            },
          },
        });
        return;
      }

      const userMessage: Message = {
        id: isRetry ? messageOrContent.id : crypto.randomUUID(),
        role: 'user',
        content: content.trim(),
        timestamp: timestampToUse,
        status: 'sending',
        retryCount: initialRetryCountForCall,
        retryLimit: effectiveRetryLimit,
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
              retryCount: initialRetryCountForCall,
            },
          },
        });
      } else {
        // If new message, add it and clear input
        dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
        dispatch({ type: 'SET_INPUT', payload: '' });
      }
      dispatch({ type: 'SET_LOADING', payload: true });
      // Scroll after adding/updating user message, but before sending to ensure input is visible
      scrollToBottom();
      console.log('Submitting message:', content); // Log the message content

      // Pass the full userMessage object and the initial retry count
      await sendMessage(userMessage, initialRetryCountForCall);
    },
    [scrollToBottom, dispatch, sendMessage, determineEffectiveRetryLimit],
  );

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
          className="p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all"
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
        <div
          className={cn(
            'flex flex-col bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden',
            isFullScreen
              ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-screen-lg h-full z-[60] rounded-none' // z-index 60, above parent's z-50
              : 'w-96 max-h-[80vh] rounded-lg',
          )}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">
              WesAI
            </h3>
            <div className="flex items-center gap-1">
              <Button
                onClick={() => dispatch({ type: 'TOGGLE_FULLSCREEN' })}
                variant="ghost"
                size="sm"
                className="p-1.5 h-auto text-foreground hover:text-primary-foreground dark:text-gray-400 dark:hover:text-gray-200"
                aria-label={
                  isFullScreen ? 'Exit full screen' : 'Enter full screen'
                }
              >
                {isFullScreen ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
              </Button>
              <Button
                onClick={resetChat}
                variant="ghost"
                size="sm"
                className="text-xs px-2 py-1 h-auto text-foreground hover:text-primary-foreground dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Start new chat"
              >
                New Chat
              </Button>
              <button
                onClick={() => dispatch({ type: 'TOGGLE_CHAT' })}
                className="p-1.5 text-foreground hover:text-primary-foreground dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary rounded"
                aria-label="Close chat"
              >
                {/* Close Icon */}
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-800">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onRetry={handleMessageSubmit}
                onDelete={handleDeleteMessage}
                onPromptClick={handleMessageSubmit} // Pass submit handler for prompts
              />
            ))}
            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-typing-indicator text-typing-indicator-foreground rounded-lg p-3 max-w-[80%] break-words shadow-sm">
                  <div className="flex items-center space-x-1.5">
                    <span
                      className="w-2 h-2 bg-typing-indicator-foreground rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    ></span>
                    <span
                      className="w-2 h-2 bg-typing-indicator-foreground rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    ></span>
                    <span
                      className="w-2 h-2 bg-typing-indicator-foreground rounded-full animate-bounce"
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
              <textarea
                ref={textareaRef} // Connect the ref here
                value={input}
                onChange={handleInput} // Use the new handleInput function
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleMessageSubmit(input);
                  }
                }}
                placeholder="Type your message..."
                disabled={isLoading} // Disable input while loading
                rows={1} // Start with one row
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 disabled:opacity-70 disabled:cursor-not-allowed resize-none overflow-hidden max-h-24" // Added resize-none and max-h-24
                aria-label="Chat input"
                style={{
                  height: 'auto',
                  minHeight: '42px', // Approximate height of a single line input
                }}
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
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
              </Button>
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
  onPromptClick,
}: Readonly<MessageBubbleProps>) => {
  const isUser = message.role === 'user';
  // Conditional styling for user vs assistant, and dark mode
  const bubbleClass = isUser
    ? 'bg-user-bubble text-user-bubble-foreground ml-auto'
    : // Assistant bubble needs to be relative for absolute positioning of copy button
      'bg-muted text-muted-foreground';
  const containerClass = isUser ? 'flex justify-end' : 'flex justify-start';
  const canRetry =
    message.status === 'error' &&
    (message.retryCount ?? 0) < (message.retryLimit ?? ConfigRetryLimit);

  // An array of prompts for generating different types of content
  const promptsToTry = [
    // Create a pie chart using Mermaid syntax with specific data
    'Create a pie chart using Mermaid syntax with the following data: AI 30%, Machine Learning 25%, Data Science 20%, and Deep Learning 25%.',

    // Design a responsive dashboard for Amazon Ads with specific metrics
    'Design a responsive dashboard for Amazon Ads displaying 100 clicks, 5000 impressions, a $500 spend, a summary of key metrics, and a table of 5 ad campaigns.',

    // Generate a JSON object for a product with specific details
    'Generate a JSON object for a product with ID 12345, named "Wireless Headphones", priced at $99.99, categorized under Electronics and Audio, including a description and an image URL.',

    // Provide an analysis of an Amazon Business Report with specific sales data
    'Provide an analysis of an Amazon Business Report with $10,000 in sales, 500 units sold, and an average rating of 4.5. Include insights on performance, trends, and customer satisfaction.',

    // Create a landing page featuring a modern and sleek design
    'Create a landing page featuring a modern and sleek design.',
  ];

  // Function to render message content with Markdown support
  return (
    <div className={`${containerClass} group relative items-start`}>
      {' '}
      {/* Added group and relative for copy button */}{' '}
      {/* Removed mb-4, handled by space-y in parent */}
      {/* Avatar for Assistant */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-sm font-bold flex-shrink-0 mr-2">
          AI
        </div>
      )}
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
            <p className="text-destructive-foreground text-xs italic font-medium">
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
                ? ` (Attempt ${message.retryCount}/${message.retryLimit ?? ConfigRetryLimit})`
                : ''}
            </p>
            {/* Render original content slightly faded */}
            <div className="prose prose-sm max-w-none dark:prose-invert opacity-75">
              {renderMessage(message.content)}
            </div>
            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-1 border-t border-border pt-1.5">
              {canRetry && (
                <button
                  onClick={() => onRetry?.(message)}
                  className="text-secondary-foreground hover:text-primary font-medium focus:outline-none focus:underline"
                  aria-label="Retry sending message"
                >
                  {' '}
                  <RotateCcw className="w-3 h-3 inline-block mr-1" /> Retry
                </button>
              )}
              <button
                onClick={() => onDelete?.(message.timestamp)}
                className="text-destructive hover:text-destructive-foreground font-medium focus:outline-none focus:underline"
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
            {/* Timestamp */}
            <span className="block text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
              {new Intl.DateTimeFormat('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
              }).format(new Date(message.timestamp))}
            </span>

            {/* "Prompts to Try" section for greeting message */}
            {message.isGreeting && onPromptClick && (
              <div className="mt-3 pt-3 border-t border-border dark:border-gray-600/50">
                {/* <p className="text-sm font-semibold mb-2 text-foreground/80 dark:text-gray-300/80">Prompts to Try:</p> */}
                <div className="flex flex-wrap gap-2">
                  {promptsToTry.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-1 px-2 border-primary/50 text-primary/90 hover:bg-primary/10 dark:border-primary/40 dark:text-primary/80 dark:hover:bg-primary/20"
                      onClick={() => onPromptClick(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Avatar for User */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-user-bubble flex items-center justify-center text-user-bubble-foreground text-sm font-bold flex-shrink-0 ml-2">
          You
        </div>
      )}
    </div>
  );
};

// --- Markdown Rendering Configuration ---
import { FC } from 'react';

interface CodeElementRendererProps {
  node?: HastElement;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

// Custom renderer for 'code' elements (both inline and fenced block code)
const CodeElementRenderer: FC<CodeElementRendererProps> = ({
  className,
  children,
}) => {
  const codeContent = String(children).replace(/\n$/, '');
  return <code className={className}>{codeContent}</code>;
};

interface PreElementRendererProps {
  children?: React.ReactNode;
  node?: HastElement; // To access properties like language from the node
}

// Custom renderer for 'pre' elements, responsible for wrapping and styling code blocks
const PreElementRenderer: FC<PreElementRendererProps> = ({
  children,
  node,
}) => {
  // Extract language from the HAST node structure
  // The `node` is the <pre> element. Its first child is typically <code>.
  // The className on the <code> element indicates the language.
  const codeNode = node?.children?.find(
    (child) => child.type === 'element' && child.tagName === 'code',
  ) as HastElement | undefined;
  const languageClass = codeNode?.properties?.className as string[] | undefined;
  const language = languageClass
    ?.find((cls) => cls.startsWith('language-'))
    ?.substring(9);

  if (language === 'mermaid' && node) {
    const rawMermaidCode = hastToString(node).trim(); // Extracts text content from the <pre> node
    return <MermaidDiagram chart={rawMermaidCode} />;
  }

  // HTML blocks are primarily handled by the `renderMessage` splitting logic using `HtmlPreview`.
  // If an HTML block (e.g., ```html) were to reach here, it would be syntax highlighted as code.
  // This is generally fine, as `renderMessage` should catch explicit ```html blocks.
  if (language === 'html' || language === 'markup') {
    // Fallthrough to default pre rendering for syntax highlighting
  }

  // Default pre rendering for other code blocks (including HTML if not caught by renderMessage)
  return (
    <div className="code-block-wrapper group/codeblock relative my-4">
      <pre className="bg-black text-white">{children}</pre>
    </div>
  );
};

const renderMessage = (content: string): JSX.Element => {
  const parts: JSX.Element[] = [];
  let lastIndex = 0;

  // Regex to find HTML code blocks: ```html...``` or JSON code blocks: ```json...```
  // Using a global flag to find all occurrences
  const codeBlockRegex = /```(html|json)\n([\s\S]*?)\n```/g;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const [fullMatch, lang, codeContent] = match;
    const startIndex = match.index;
    const endIndex = codeBlockRegex.lastIndex;

    // Add text before the current code block
    if (startIndex > lastIndex) {
      const textBefore = content.substring(lastIndex, startIndex);
      parts.push(
        <ReactMarkdown
          key={`markdown-before-${lastIndex}`}
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[
            rehypeKatex,
            [
              rehypePrismPlus,
              { ignoreMissing: true, defaultLanguage: 'plaintext' },
            ],
          ]}
          components={{
            pre: PreElementRenderer, // Use custom pre renderer
            code: CodeElementRenderer, // Use custom code renderer
          }}
        >
          {textBefore}
        </ReactMarkdown>,
      );
    }

    // Add the appropriate preview component based on language
    if (lang === 'html') {
      parts.push(
        <HtmlPreview
          key={`html-preview-${startIndex}`}
          htmlContent={codeContent}
        />,
      );
    } else if (lang === 'json') {
      parts.push(
        <JsonViewer
          key={`json-viewer-${startIndex}`}
          jsonContent={codeContent}
        />,
      );
    }

    lastIndex = endIndex;
  }

  // Add any remaining text after the last code block
  if (lastIndex < content.length) {
    const textAfter = content.substring(lastIndex);
    parts.push(
      <ReactMarkdown
        key={`markdown-after-${lastIndex}`}
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeKatex,
          [
            rehypePrismPlus,
            { ignoreMissing: true, defaultLanguage: 'plaintext' },
          ],
        ]}
        components={{
          pre: PreElementRenderer, // Use custom pre renderer
          code: CodeElementRenderer, // Use custom code renderer
        }}
      >
        {textAfter}
      </ReactMarkdown>,
    );
  }

  // If no special code blocks were found, render the entire content as a single markdown block
  if (parts.length === 0) {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeKatex,
          [
            rehypePrismPlus,
            { ignoreMissing: true, defaultLanguage: 'plaintext' },
          ],
        ]}
        components={{
          pre: PreElementRenderer, // Use custom pre renderer
          code: CodeElementRenderer, // Use custom code renderer
        }}
      >
        {content}
      </ReactMarkdown>
    );
  }

  return <>{parts}</>;
};

// Rollback strategy: To revert to the previous version, simply remove the cached
