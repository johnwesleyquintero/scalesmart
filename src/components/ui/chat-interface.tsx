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
  isEdited?: boolean; // Flag if the message has been edited
  editedAt?: number; // Timestamp of when the message was last edited
}

interface MessageBubbleProps {
  message: Message;
  onRetry?: (message: Message) => void;
  onDelete?: (timestamp: number) => void;
  onPromptClick?: (promptText: string) => void; // For "Prompts to Try"
  onEdit?: (message: Message) => void;
}

type ChatState = {
  messages: Message[];
  input: string;
  isLoading: boolean; // True when waiting for AI response
  isChatOpen: boolean; // Controls visibility of the chat window
  isFullScreen: boolean; // New state for fullscreen mode
  editingMessage: Message | null; // New state to hold the message being edited
  mode: 'default' | 'content' | 'code'; // New state for the agent mode, including 'code'
};

type ChatAction =
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'SET_INPUT'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'TOGGLE_CHAT' }
  | { type: 'TOGGLE_FULLSCREEN' }
  | { type: 'TOGGLE_MODE' } // New action to toggle the mode
  | { type: 'ADD_MESSAGE'; payload: Message }
  | {
      type: 'UPDATE_MESSAGE';
      payload: {
        timestamp: number;
        role: 'user' | 'assistant'; // Include role for robustness if multiple messages could have same timestamp (though unlikely)
        updates: Partial<Message>;
      };
    }
  | { type: 'REMOVE_MESSAGE'; payload: number } // Payload is the timestamp
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_EDITING_MESSAGE'; payload: Message | null };

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
  role: 'user' | 'assistant', // Include role in update logic
  updates: Partial<Message>,
): Message[] => {
  return messages.map((msg) =>
    msg.timestamp === timestamp && msg.role === role // Match by timestamp and role
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
  editingMessage: null, // Initialize to null
  mode: 'default', // Initialize mode to 'default'
};

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'TOGGLE_MODE': {
      // Cycle through 'default', 'content', 'code'
      let nextMode: 'default' | 'content' | 'code';
      if (state.mode === 'default') {
        nextMode = 'content';
      } else if (state.mode === 'content') {
        nextMode = 'code';
      } else {
        nextMode = 'default';
      }
      return {
        ...state,
        mode: nextMode,
      };
    } // Added curly braces to fix 'no-case-declarations'
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'ADD_MESSAGE': {
      // Added curly braces to fix 'no-case-declarations'
      // Ensure message has an ID if not already provided (e.g., for retry)
      const newMessage = action.payload.id
        ? action.payload
        : { ...action.payload, id: crypto.randomUUID() };

      // Avoid adding duplicates based on ID (more robust than timestamp/role for retries)
      if (state.messages.some((m) => m.id === newMessage.id)) {
        return state;
      }
      return { ...state, messages: [...state.messages, newMessage] };
    } // Added closing curly brace
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: updateMessageInState(
          state.messages,
          action.payload.timestamp,
          action.payload.role, // Pass role to update helper
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
        isFullScreen: !state.isChatOpen ? false : state.isFullScreen, // If chat is closing, exit fullscreen
      };
    case 'TOGGLE_FULLSCREEN':
      return { ...state, isFullScreen: !state.isFullScreen };
    case 'SET_EDITING_MESSAGE':
      return {
        ...state,
        editingMessage: action.payload,
        // Set input field content if starting edit, clear if cancelling
        input: action.payload ? action.payload.content : '',
      };
    default:
      // Ensure exhaustive check for action types if using TypeScript 4.9+
      // const _exhaustiveCheck: never = action;
      return state;
  }
}

// --- Constants ---
const DEFAULT_RETRY_LIMIT = 3;

// --- Pure Helper Functions (can be outside the component) ---

// Helper to extract a meaningful error message from a raw API response text.
function getErrorMessageFromRawResponse(
  rawResponse: string,
  statusCode: number,
): string {
  const Suffix = '... (response truncated)';
  const MaxLength = 200;

  try {
    const errorData = JSON.parse(rawResponse);
    if (typeof errorData.error === 'string' && errorData.error.trim() !== '') {
      return errorData.error;
    }
    if (
      typeof errorData.message === 'string' &&
      errorData.message.trim() !== ''
    ) {
      return errorData.message;
    }
    // Fallback to truncated raw response if JSON was valid but no specific error field found
    if (rawResponse.trim() !== '' && rawResponse.trim() !== '{}') {
      return `Server Error ${statusCode}: ${rawResponse.substring(0, MaxLength)}${rawResponse.length > MaxLength ? Suffix : ''}`;
    }
  } catch (jsonParseError) {
    // If JSON parsing fails, use the truncated raw response
    return `Server Error ${statusCode}: ${rawResponse.substring(0, MaxLength)}${rawResponse.length > MaxLength ? Suffix : ''}`;
  }
  return `Server Error ${statusCode}: Empty or unparseable response.`;
}

// Parses an error response from the API
async function parseApiErrorResponse(apiResponse: Response): Promise<string> {
  let errorResponseMessage = `API Error: ${apiResponse.status} ${apiResponse.statusText}`;

  try {
    const rawErrorResponse = await apiResponse.text();
    if (rawErrorResponse) {
      errorResponseMessage = getErrorMessageFromRawResponse(
        rawErrorResponse,
        apiResponse.status,
      );
    }
  } catch (textReadError) {
    console.error('Failed to read API error response as text:', textReadError);
    // If reading text fails, stick with the initial status text message
  }
  return errorResponseMessage;
}

// --- Types and Helpers for AI Content Processing ---

// Define the expected structure of the chat API response
interface ChatApiResponse {
  response: AiContentRaw;
  // Add other potential properties if the API returns them
  // e.g., sessionId?: string;
}

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
  mermaid?: string; // Add mermaid here if API returns it this way
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

// Type guard for ContentBlock
function isContentBlock(item: unknown): item is ContentBlock {
  return (
    typeof item === 'object' &&
    item !== null &&
    'type' in item &&
    typeof (item as ContentBlock).type === 'string' &&
    'content' in item &&
    typeof (item as ContentBlock).content === 'string' // Ensure content is string
  );
}

// Type guard for OtherObjectContent (basic check)
function isOtherObjectContent(item: unknown): item is OtherObjectContent {
  return (
    typeof item === 'object' &&
    item !== null &&
    !Array.isArray(item) && // Exclude arrays
    // Check for at least one known property or allow any object as a fallback
    ('html' in item ||
      'css' in item ||
      'javascript' in item ||
      'json' in item ||
      'mermaid' in item ||
      Object.keys(item).length > 0)
  );
}

// Helper for single ContentBlock
function processSingleContentBlock(block: ContentBlock): string {
  // Process based on the 'type' field
  switch (block.type) {
    case 'html':
      return `\`\`\`html\n${block.content}\n\`\`\``;
    case 'css':
      return `\`\`\`css\n${block.content}\n\`\`\``;
    case 'javascript':
      return `\`\`\`javascript\n${block.content}\n\`\`\``;
    case 'code': // Generic code block, use provided language or default
      return `\`\`\`${block.language || 'plaintext'}\n${block.content}\n\`\`\``;
    case 'json':
      return `\`\`\`json\n${block.content}\n\`\`\``;
    case 'mermaid': // Handle mermaid if it comes as a content block type
      return `\`\`\`mermaid\n${block.content}\n\`\`\``;
    default:
      // Fallback: if type is unknown, represent the block as a JSON code block
      console.warn(
        `Unknown content block type: ${block.type}. Rendering as JSON.`,
      );
      return `\`\`\`json\n${JSON.stringify(block, null, 2)}\n\`\`\``;
  }
}

// Helper for OtherObjectContent
function processOtherObjectContent(obj: OtherObjectContent): string {
  // Prioritize known code-like structures
  if (typeof obj.html === 'string') return `\`\`\`html\n${obj.html}\n\`\`\``;
  if (typeof obj.css === 'string') return `\`\`\`css\n${obj.css}\n\`\`\``;
  if (typeof obj.javascript === 'string')
    return `\`\`\`javascript\n${obj.javascript}\n\`\`\``;
  if (typeof obj.json === 'string') return `\`\`\`json\n${obj.json}\n\`\`\``;
  if (typeof obj.mermaid === 'string')
    // Handle mermaid if it comes as a top-level property
    return `\`\`\`mermaid\n${obj.mermaid}\n\`\`\``;

  // Fallback for any other object structure, treat as JSON
  console.warn(
    `Processing unknown object content structure. Rendering as JSON.`,
  );
  return `\`\`\`json\n${JSON.stringify(obj, null, 2)}\n\`\`\``;
}

// Processes the raw AI content received from the API into a single Markdown string.
// Handles strings, ContentBlock objects, OtherObjectContent objects, and arrays of these types.
const processAiContentRaw = (rawContent: AiContentRaw): string => {
  if (typeof rawContent === 'string') {
    return rawContent;
  }
  // Explicitly handle null or undefined
  if (rawContent === null || typeof rawContent === 'undefined') {
    console.warn(
      'processAiContentRaw received null or undefined, defaulting to empty string.',
    );
    return '';
  }

  // Handle arrays of items
  if (Array.isArray(rawContent)) {
    return rawContent
      .map((item: ArrayItemType) => {
        if (typeof item === 'string') return item;
        if (isContentBlock(item)) {
          return processSingleContentBlock(item);
        }
        if (isOtherObjectContent(item)) {
          // Use refined type guard
          return processOtherObjectContent(item);
        }
        // Fallback for unexpected array item types
        console.warn('Array contains unexpected item type:', item);
        return String(item); // Convert unexpected types to string as a fallback
      })
      .join('\n\n'); // Join array items with double newline for separation
  }

  // Handle single objects
  if (isContentBlock(rawContent)) {
    return processSingleContentBlock(rawContent);
  }
  if (isOtherObjectContent(rawContent)) {
    // Use refined type guard
    return processOtherObjectContent(rawContent);
  }

  // Fallback for any other unexpected raw content type
  console.warn(
    'processAiContentRaw received unexpected raw content type:',
    rawContent,
  );
  return String(rawContent); // Convert unexpected types to string as a fallback
};

// Fetches chat response and processes it into a success or error object
async function fetchAndProcessChatApi(
  sanitizedContent: string,
  currentMessages: Message[],
  currentMode: ChatState['mode'], // Updated type to include 'code' - Fixes TS error 2345
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
        // Filter history to include only 'sent' messages for context
        history: currentMessages
          .filter((msg) => msg.status === 'sent')
          .map(({ role, content }) => ({ role, content })),
        mode: currentMode, // Include the current mode in the request body
      }),
      cache: 'no-store', // Ensure fresh response
    });
    console.timeEnd('Fetch /api/chat');
    console.log('API Response Status:', apiResponse.status);

    if (!apiResponse.ok) {
      // Handle non-2xx responses as API errors
      const errorMessage = await parseApiErrorResponse(apiResponse);
      return { type: 'error', message: errorMessage };
    }

    // Attempt to parse JSON response
    let data: ChatApiResponse; // Use the new interface here
    try {
      data = (await apiResponse.json()) as ChatApiResponse; // Cast to the new interface
      console.log('API Data:', data);
    } catch (jsonError) {
      console.error('Failed to parse API response as JSON:', jsonError);
      // If JSON parsing fails for an OK response, treat it as a content error
      return { type: 'error', message: 'Invalid JSON response from API.' };
    }

    const aiContentRaw = data?.response; // Extract the main response content

    // Process the raw content into a displayable markdown string
    const aiContent = processAiContentRaw(aiContentRaw);
    console.log('Processed aiContent before sending to UI:', aiContent);

    // Create the assistant message object
    const assistantMessage: Message = {
      id: crypto.randomUUID(), // Generate a unique ID for the assistant message
      role: 'assistant',
      content:
        aiContent.trim() !== ''
          ? aiContent
          : "Sorry, I couldn't fetch a valid response content. Please try again.", // Default message for empty content
      timestamp: Date.now(),
      status: 'sent', // Assistant message is 'sent' once received
    };

    return { type: 'success', data: assistantMessage };
  } catch (error) {
    // Catch network errors or issues with fetch/json itself
    console.error('Error in fetchAndProcessChatApi:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'An unknown network error occurred.';
    return { type: 'error', message };
  }
}

// --- Main Chat Component ---
export default function ChatInterface() {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const {
    messages,
    input,
    isLoading,
    isChatOpen,
    isFullScreen,
    editingMessage,
    mode, // Destructure mode from state
  } = state;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- Helper Functions ---

  // Maps a ChatMessageRecord from the DB to the Message interface used in the UI
  const mapDbRecordToMessage = (record: ChatMessageRecord): Message => {
    return {
      id: record.id?.toString(), // Dexie ID is number, UI needs string
      role: record.sender === 'ai' ? 'assistant' : 'user', // Map 'ai' to 'assistant', 'user' to 'user'
      content: record.text,
      timestamp: record.timestamp,
      // Map other fields from record.metadata if necessary
      status: record.metadata?.status as Message['status'],
      error: record.metadata?.error as Message['error'],
      retryCount: record.metadata?.retryCount as Message['retryCount'],
      retryLimit: record.metadata?.retryLimit as Message['retryLimit'],
      isGreeting: record.metadata?.isGreeting as Message['isGreeting'],
      isEdited: record.metadata?.isEdited as Message['isEdited'],
      editedAt: record.metadata?.editedAt as Message['editedAt'],
    };
  };

  const scrollToBottom = useCallback(() => {
    // Use a slight delay to ensure DOM has updated after message render
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  // Effect for initial load and subsequent messages
  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
      // Focus textarea only if not currently editing, as editing message sets input
      if (!editingMessage) {
        textareaRef.current?.focus();
      }
    }
  }, [messages, isChatOpen, scrollToBottom, editingMessage]); // Depend on messages, isChatOpen, scrollToBottom, editingMessage

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height to recalculate
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]); // Depend on input to resize as text is typed

  // Generate a unique session ID for this chat session, persistent across renders but reset on explicit chat reset.
  const chatSessionIdRef = useRef<string>(crypto.randomUUID());

  // Function to reset chat (clear messages and generate new session ID)
  const resetChat = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' });
    chatSessionIdRef.current = crypto.randomUUID(); // Generate a new session ID
    console.log('Chat reset. New session ID:', chatSessionIdRef.current);
    // Clear editing state and input on reset
    dispatch({ type: 'SET_EDITING_MESSAGE', payload: null });
    dispatch({ type: 'SET_INPUT', payload: '' });
  }, [dispatch]);

  // Load messages from IndexedDB when the component mounts or session ID changes
  useEffect(() => {
    const loadMessages = async () => {
      console.log('ChatInterface: Attempting to load messages from IndexedDB.');
      try {
        await initializeDB(); // Ensure the Dexie db instance is open and ready
        console.log('ChatInterface: initializeDB completed.');

        // Use the current value of the ref
        const dbMessages = await getChatMessagesBySession(
          chatSessionIdRef.current,
        );
        console.log('ChatInterface: Fetched messages from DB:', dbMessages);

        const uiMessages = dbMessages.map(mapDbRecordToMessage);
        dispatch({ type: 'SET_MESSAGES', payload: uiMessages });
        console.log(
          `Chat messages loaded from IndexedDB (${uiMessages.length} messages).`,
        );
      } catch (error) {
        console.error('ChatInterface: Error in loadMessages:', error);
      }
    };
    // Effect should only run once on mount or if the dependency (session ID ref value) *conceptually* changes,
    // but ref values don't trigger effects directly. The dependency array should contain
    // values that *do* trigger the effect. The session ID is managed manually via `resetChat`.
    // Loading only needs to happen on mount. If a new session is started, the CLEAR_MESSAGES
    // action handles the UI state, and saving will start saving under the new ID.
    // Let's make this effect run only once on mount.
    loadMessages();
  }, []); // Empty dependency array means run once on mount

  // Save messages to IndexedDB when they change
  useEffect(() => {
    const saveMessages = async () => {
      // Add a small debounce/delay to avoid writing too frequently during fast updates
      const handler = setTimeout(async () => {
        if (typeof window !== 'undefined') {
          console.log(
            'ChatInterface: Attempting to save messages to IndexedDB.',
          );
          // Iterate over current messages in state and save/update them
          // Consider optimizing this to only save messages that have changed.
          // For simplicity now, rewrite all current messages for the session.
          // In a real app with many messages, a more granular approach might be needed.
          const messagesToSave = messages.map((message) => ({
            id: message.id!, // Assuming ID is always set by ADD_MESSAGE
            sender: mapMessageRoleToSender(message.role),
            text: message.content,
            timestamp: message.timestamp,
            metadata: {
              status: message.status,
              error: message.error,
              retryCount: message.retryCount,
              retryLimit: message.retryLimit,
              isGreeting: message.isGreeting,
              isEdited: message.isEdited,
              editedAt: message.editedAt,
            },
          }));

          // Simple approach: clear session in DB and save all current messages
          // This is less efficient for single message updates but simpler to implement
          // and ensures DB matches UI state. Needs Dexie transaction for robustness.
          // A better way is to track added/updated/deleted messages and apply those changes.
          // For now, let's just save all messages in the current state for the session ID.
          for (const messageDataPayload of messagesToSave) {
            try {
              await setItem(chatSessionIdRef.current, messageDataPayload);
            } catch (error) {
              console.error(
                `ChatInterface: Failed to save message ${messageDataPayload.id} to IndexedDB:`,
                error,
              );
            }
          }
          console.log(
            `ChatInterface: ${messages.length} messages saved to IndexedDB for session ${chatSessionIdRef.current}.`,
          );
        }
      }, 500); // Debounce for 500ms

      return () => clearTimeout(handler); // Cleanup timeout on effect re-run or unmount
    };
    // Only run saveMessages if there are messages to save, to avoid issues on clear or initial load
    // and prevent unnecessary saves when messages array is empty.
    if (messages.length > 0 || !isChatOpen) {
      // Save when messages exist or when closing chat (to persist state)
      saveMessages();
    } else if (messages.length === 0 && isChatOpen) {
      // If chat is open but messages are empty, this might be a new session
      // Ensure any remnants of the old session (if same ID) are cleared or handled.
      // The loadMessages effect on mount should cover loading, and resetChat handles new sessions.
      // No save needed if messages are explicitly cleared and empty.
    }
  }, [messages, isChatOpen]); // Run whenever messages array or chat open state changes

  // Send initial greeting if chat is opened and empty
  useEffect(() => {
    // Check if chat is open, there are no user/assistant messages (allow only the greeting),
    // not currently loading, and a greeting hasn't already been added (by checking messages.length)
    const hasUserOrAssistantMessages = messages.some(
      (msg) =>
        msg.role === 'user' || (msg.role === 'assistant' && !msg.isGreeting),
    );

    if (
      isChatOpen &&
      messages.length === 0 &&
      !isLoading &&
      !hasUserOrAssistantMessages
    ) {
      const greetingMessage: Message = {
        id: crypto.randomUUID(), // Give the greeting a stable ID
        role: 'assistant',
        content:
          "Hey there! I'm WesAI.\n\n" +
          'I can turn your raw data into insights! or try one of these prompts:',
        timestamp: Date.now(),
        status: 'sent',
        isGreeting: true, // Mark this as the greeting message
      };
      dispatch({ type: 'ADD_MESSAGE', payload: greetingMessage });
      console.log('Initial greeting message dispatched.');
    }
  }, [isChatOpen, messages, isLoading, dispatch]); // Re-run if chat opens, messages change, or loading state changes

  // --- Message Handling Logic ---

  // Helper to determine the effective retry limit for a message
  const determineEffectiveRetryLimit = useCallback(
    (message?: Message): number => {
      // Use message-specific limit if provided, otherwise use config, default to 3
      return message?.retryLimit ?? ConfigRetryLimit ?? DEFAULT_RETRY_LIMIT;
    },
    [],
  ); // Include ConfigRetryLimit as a dependency

  // Function to send message to API and handle response/retries
  const sendMessage = useCallback(
    async (
      userMessage: Message, // The specific user message object being sent/retried
      currentRetryCount: number, // The retry attempt number for this specific message
    ) => {
      const effectiveRetryLimit = determineEffectiveRetryLimit(userMessage);

      // Skip sending if max retries reached for this message
      if (currentRetryCount > effectiveRetryLimit) {
        console.warn(
          `Max retries (${effectiveRetryLimit}) already reached for message ID ${userMessage.id}. Aborting send.`,
        );
        // Ensure message status reflects failure if somehow this function was called past the limit
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: {
            timestamp: userMessage.timestamp,
            role: 'user', // Ensure role is correct
            updates: {
              status: 'error',
              error:
                userMessage.error ||
                `Failed after ${effectiveRetryLimit} retries.`, // Keep existing error or set a default
              retryCount: currentRetryCount - 1, // Show the count it failed AT
            },
          },
        });
        dispatch({ type: 'SET_LOADING', payload: false });
        return; // Stop execution
      }

      // Sanitize the message content before sending
      const sanitizedContent = DOMPurify.sanitize(userMessage.content);

      // Update UI to show sending status if it's not already (e.g., from an explicit retry click)
      dispatch({
        type: 'UPDATE_MESSAGE',
        payload: {
          timestamp: userMessage.timestamp,
          role: 'user',
          updates: {
            status: 'sending',
            error: undefined, // Clear any previous error on send attempt
            retryCount: currentRetryCount, // Update retry count on each attempt
          },
        },
      });
      // Set global loading state if it's the first attempt (retryCount 0) or not already loading
      if (currentRetryCount === 0 || !isLoading) {
        dispatch({ type: 'SET_LOADING', payload: true });
      }

      try {
        // Find the *current* state of messages for history
        // Use `state.messages` directly within the useCallback because it's called inside the function scope
        // where `state` is accessible via closure, or pass it as a parameter/dependency if strictly needed.
        // Passing `messages` as a dependency of `sendMessage` useCallback makes sense.
        const currentMessagesInState = messages; // Access current state via closure/dependency

        const result = await fetchAndProcessChatApi(
          sanitizedContent,
          currentMessagesInState, // Pass current messages state
          mode, // Pass the current mode to the API call
        );

        if (result.type === 'success') {
          // API call was successful, and we got a response (even if it's an error message from AI)
          // Update the user message status to 'sent'
          dispatch({
            type: 'UPDATE_MESSAGE',
            payload: {
              timestamp: userMessage.timestamp,
              role: 'user',
              updates: {
                status: 'sent',
                error: undefined, // Ensure error is cleared on success
                retryCount: currentRetryCount, // Keep track of attempts even on success after retry
              },
            },
          });
          // Add the assistant's response message
          dispatch({ type: 'ADD_MESSAGE', payload: result.data }); // result.data is already a Message
        } else {
          // result.type === 'error' - API call itself failed (network issue, server error etc.)
          console.error(
            `API call failed for message ID ${userMessage.id}: ${result.message}`,
          );
          const nextRetryCount = currentRetryCount + 1;

          if (nextRetryCount <= effectiveRetryLimit) {
            const delay =
              Math.pow(2, nextRetryCount) * 1000 + Math.random() * 1000; // Exponential backoff with jitter
            console.log(
              `Retrying message ID ${userMessage.id} (attempt ${nextRetryCount}/${effectiveRetryLimit}) in ${delay / 1000}s. Error: ${result.message}`,
            );
            // Update UI to show retrying status (can use 'sending' or a dedicated 'retrying')
            dispatch({
              type: 'UPDATE_MESSAGE',
              payload: {
                timestamp: userMessage.timestamp,
                role: 'user',
                updates: {
                  status: 'sending', // Keep as 'sending' or use a dedicated 'retrying' status
                  error: `Attempt ${nextRetryCount}/${effectiveRetryLimit} failed: ${result.message}`, // Show specific retry error
                  retryCount: nextRetryCount,
                },
              },
            });
            // Schedule retry using the original user message object
            setTimeout(() => {
              sendMessage(userMessage, nextRetryCount); // Recursive call for retry
            }, delay);
            // Return here to prevent `finally` from setting isLoading to false if a retry is scheduled
            return;
          } else {
            // Max retries reached
            console.warn(
              `Max retries (${effectiveRetryLimit}) reached for message ID ${userMessage.id}. Final error: ${result.message}`,
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
                  ? `Internal Error: ${unexpectedError.message}`
                  : 'A critical internal error occurred.',
              retryCount: currentRetryCount,
            },
          },
        });
      } finally {
        // This block executes if the try block completes or if an error is caught and not returned from.
        // It will NOT execute if `sendMessage` returns early after scheduling a retry.
        // Only set loading to false if no retry was scheduled.
        // A simple way is to check if the message status is now 'sent' or 'error'.
        const latestMessageState = messages.find(
          (m) => m.id === userMessage.id,
        ); // Find updated state
        if (latestMessageState?.status !== 'sending') {
          // If status is not 'sending' (which includes retrying state)
          dispatch({ type: 'SET_LOADING', payload: false });
        }
        scrollToBottom(); // Always attempt to scroll after processing
      }
    },
    [
      messages,
      mode,
      scrollToBottom,
      dispatch,
      determineEffectiveRetryLimit,
      isLoading,
    ], // Dependencies
  );

  // Handler for input changes
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      dispatch({ type: 'SET_INPUT', payload: e.target.value });
    },
    [dispatch],
  );

  // Handler for sending a new message or retrying/editing an existing one
  const handleMessageSubmit = useCallback(
    async (messageOrContent: Message | string) => {
      const isRetryOrEdit = typeof messageOrContent !== 'string';
      let content = '';
      let timestampToUse: number;
      let messageIdToUse: string | undefined; // Use ID for better tracking
      let initialRetryCountForCall: number = 0; // Initialize to 0 for new messages
      let isEditingFlow = false;

      // Determine the message object based on input type
      let userMessage: Message;

      if (isRetryOrEdit) {
        // This is a retry or an edit submission (message object is passed)
        const originalMessage = messageOrContent as Message;
        content = originalMessage.content;
        timestampToUse = originalMessage.timestamp;
        messageIdToUse = originalMessage.id; // Use existing ID
        initialRetryCountForCall = originalMessage.retryCount ?? 0;
        isEditingFlow = !!editingMessage; // Check if the global editing state is active

        userMessage = { ...originalMessage, content: content.trim() }; // Use original message props, update content if edited
      } else {
        // This is a brand new message (string content is passed)
        content = messageOrContent;
        timestampToUse = Date.now(); // Use current time for timestamp
        messageIdToUse = crypto.randomUUID(); // Generate a new ID
        initialRetryCountForCall = 0; // Starts at 0 retries

        userMessage = {
          id: messageIdToUse,
          role: 'user',
          content: content.trim(),
          timestamp: timestampToUse,
          status: 'sending', // Optimistically set status to sending
          retryCount: initialRetryCountForCall,
          retryLimit: determineEffectiveRetryLimit(undefined), // Default retry limit for new messages
        };
      }

      // Ensure content is not empty after trimming
      if (!userMessage.content) {
        return;
      }

      // Handle Editing Flow Separately
      if (
        isEditingFlow &&
        editingMessage &&
        userMessage.id === editingMessage.id
      ) {
        console.log('Submitting edited message:', userMessage.id);
        // Update the existing message in state
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: {
            timestamp: editingMessage.timestamp,
            role: 'user', // Assuming only user messages are edited
            updates: {
              content: userMessage.content, // Use the potentially edited content
              status: 'sent', // Mark as sent after successful edit submission
              error: undefined, // Clear any errors on successful edit
              isEdited: true, // Mark as edited
              editedAt: Date.now(),
              // Preserve retryCount and retryLimit? Yes, if they were there.
              retryCount: editingMessage.retryCount,
              retryLimit: editingMessage.retryLimit,
            },
          },
        });
        // Clear editing state and input
        dispatch({ type: 'SET_EDITING_MESSAGE', payload: null });
        dispatch({ type: 'SET_INPUT', payload: '' });
        // Note: Editing usually doesn't trigger a new API call.
        // If editing a message and resending is desired, the logic would need adjustment.
        // Current logic assumes editing fixes local content display.
        // If API call is needed after edit, call sendMessage here.
        // For now, assume edit is local UI fix.
        scrollToBottom();
        return; // Exit function after handling edit
      }

      // Handle New Message or Retry Flow
      const effectiveRetryLimit = determineEffectiveRetryLimit(userMessage);
      // Check retry limit before proceeding with API call
      if (isRetryOrEdit && initialRetryCountForCall >= effectiveRetryLimit) {
        console.warn(
          `Retry limit reached for message ID ${userMessage.id}. Cannot send.`,
        );
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: {
            timestamp: userMessage.timestamp,
            role: 'user',
            updates: {
              status: 'error', // Ensure status is error
              error:
                userMessage.error ||
                `Failed after ${effectiveRetryLimit} retries. Cannot send.`, // Show final error message
              retryCount: initialRetryCountForCall, // Show the count at which it failed
            },
          },
        });
        dispatch({ type: 'SET_LOADING', payload: false }); // Ensure loading is off
        return; // Stop execution
      }

      // Optimistic UI Update for New Message or Retry
      if (!isRetryOrEdit) {
        // It's a brand new message
        dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
        dispatch({ type: 'SET_INPUT', payload: '' }); // Clear input only for new messages
      } else {
        // It's a retry
        // Status update happens inside sendMessage now before the API call attempt
        // This prevents a flicker if sendMessage immediately updates status.
      }

      // Set global loading state and scroll
      // Loading state is handled more granularly inside sendMessage now.
      // dispatch({ type: 'SET_LOADING', payload: true }); // Removed, handled in sendMessage
      scrollToBottom(); // Scroll after adding/updating user message

      console.log('Sending message ID:', userMessage.id); // Log the message ID being sent
      // Call the sendMessage function to handle the API call and potential retries
      await sendMessage(userMessage, initialRetryCountForCall);
    },
    [
      scrollToBottom,
      dispatch,
      sendMessage,
      determineEffectiveRetryLimit,
      editingMessage,
    ], // Dependencies
  );

  // --- Delete Handler ---
  const handleDeleteMessage = useCallback(
    (timestamp: number) => {
      // Find the message by timestamp to get its role (important for updateMessageInState)
      const messageToDelete = messages.find(
        (msg) => msg.timestamp === timestamp,
      );
      if (messageToDelete) {
        dispatch({ type: 'REMOVE_MESSAGE', payload: timestamp });
        // Note: This only removes from state and saves to DB (where it will be absent).
        // A more robust system might mark as deleted in DB.
        console.log('Message deleted:', timestamp);
      } else {
        console.warn('Attempted to delete message not found:', timestamp);
      }
    },
    [dispatch, messages],
  ); // messages is needed to find the message

  // --- Edit Handler ---
  const handleEditMessage = useCallback(
    (message: Message) => {
      // Set the message to be edited in state
      dispatch({ type: 'SET_EDITING_MESSAGE', payload: message });
      // The input field content is automatically set by the SET_EDITING_MESSAGE case in the reducer
      // Focus the textarea after setting edit mode
      textareaRef.current?.focus();
    },
    [dispatch],
  );

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
            'flex flex-col bg-background shadow-xl border border-border overflow-hidden',
            isFullScreen
              ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-screen-lg h-full z-[60] rounded-none' // z-index 60, above parent's z-50
              : 'w-96 max-h-[80vh] rounded-lg',
          )}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-3 border-b border-border bg-muted">
            <h3 className="font-semibold text-foreground flex items-center">
              WesAI
              {!isLoading && (
                <span className="ml-2 text-xs font-normal text-green-500 dark:text-green-400">
                  Online
                </span>
              )}
              {isLoading && (
                <span className="ml-2 text-xs font-normal text-yellow-600 dark:text-yellow-500">
                  Typing...
                </span>
              )}
            </h3>
            <div className="flex items-center gap-1">
              <Button
                onClick={() => dispatch({ type: 'TOGGLE_FULLSCREEN' })}
                variant="ghost"
                size="sm"
                className="p-1.5 h-auto text-muted-foreground hover:text-foreground"
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
                className="text-xs px-2 py-1 h-auto text-muted-foreground hover:text-foreground"
                aria-label="Start new chat"
              >
                New Chat
              </Button>
              {/* Mode Toggle Button */}
              <Button
                onClick={() => dispatch({ type: 'TOGGLE_MODE' })}
                variant="ghost"
                size="sm"
                className="text-xs px-2 py-1 h-auto text-muted-foreground hover:text-foreground"
                aria-label={`Toggle mode (current: ${mode})`}
              >
                Mode: {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Button>
              <button
                onClick={() => dispatch({ type: 'TOGGLE_CHAT' })}
                className="p-1.5 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded"
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
                key={msg.id || msg.timestamp} // Use ID first if available, fallback to timestamp
                message={msg}
                onRetry={handleMessageSubmit}
                onDelete={handleDeleteMessage}
                onPromptClick={handleMessageSubmit} // Pass submit handler for prompts
                onEdit={handleEditMessage} // Pass the new edit handler
              />
            ))}
            {/* Typing Indicator (Removed - isLoading already shows "Typing...") */}
            <div ref={messagesEndRef} /> {/* Anchor for scrolling */}
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-4 bg-background">
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
                  // Submit on Enter key, unless Shift or Ctrl/Cmd is held
                  if (
                    e.key === 'Enter' &&
                    !e.shiftKey &&
                    !e.ctrlKey &&
                    !e.metaKey
                  ) {
                    e.preventDefault();
                    handleMessageSubmit(input);
                  }
                }}
                placeholder={
                  editingMessage ? 'Editing message...' : 'Type your message...'
                }
                disabled={isLoading} // Disable input while loading
                rows={1} // Start with one row
                className="flex-1 rounded-lg border border-border p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-input text-foreground placeholder-muted-foreground disabled:opacity-70 disabled:cursor-not-allowed resize-none overflow-hidden max-h-24" // Added resize-none and max-h-24
                aria-label="Chat input"
                style={{
                  height: 'auto',
                  minHeight: '42px', // Approximate height of a single line input
                }}
              />
              {editingMessage && (
                <Button
                  type="button" // Use type="button" to prevent form submission
                  variant="ghost"
                  onClick={() =>
                    dispatch({ type: 'SET_EDITING_MESSAGE', payload: null })
                  }
                  aria-label="Cancel editing"
                  className="px-2 py-1"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={!input.trim() || isLoading} // Disable if input is empty or loading
                aria-label={
                  editingMessage ? 'Save edited message' : 'Send message'
                }
              >
                {
                  isLoading ? (
                    // Loading Spinner Icon
                    <svg
                      className="animate-spin h-5 w-5 text-white" // Adjusted text color for visibility
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
                  ) : editingMessage ? (
                    'Save'
                  ) : (
                    'Send'
                  ) // Change button text based on editing state
                }
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
  onEdit, // Accept onEdit prop
}: Readonly<MessageBubbleProps>) => {
  const isUser = message.role === 'user';
  // Conditional styling for user vs assistant, and dark mode
  const bubbleClass = isUser
    ? 'bg-blue-700 text-white ml-auto rounded-br-none' // User bubble on right, rounded bottom right corner removed
    : // Assistant bubble needs to be relative for absolute positioning of copy button
      'bg-gray-200 text-gray-900 rounded-bl-none'; // Assistant bubble on left, rounded bottom left corner removed
  const containerClass = isUser ? 'flex justify-end' : 'flex justify-start';
  const canRetry =
    message.status === 'error' && // Only allow retry if status is error
    isUser && // Only allow retry for user messages
    (message.retryCount ?? 0) < (message.retryLimit ?? ConfigRetryLimit); // Check retry limit

  // An array of prompts for generating different types of content
  const promptsToTry = [
    'Help me analyze the provided code for potential readability enhancements and suggest improvements based on best practices.',
  ];

  // Function to render message content with Markdown support (defined outside component)
  return (
    <div className={`${containerClass} group relative items-start`}>
      {' '}
      {/* Added group and relative for copy button and positioning */}{' '}
      {/* Removed mb-4, handled by space-y in parent */}
      {/* Avatar for Assistant */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-sm font-bold flex-shrink-0 mr-2">
          AI
        </div>
      )}
      <div
        className={`${bubbleClass} max-w-[80%] rounded-lg p-3 break-words shadow-sm relative`} // Added relative for potential action buttons positioning
      >
        {/* Copy Button for Assistant Messages */}
        {!isUser && message.status === 'sent' && (
          // Position copy button at the top right corner of the assistant message bubble
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <CopyMarkdownButton content={message.content} />
          </div>
        )}

        {/* User Message Action Buttons (Edit/Delete/Retry) */}
        {isUser &&
          message.status !== 'sending' && ( // Only show actions for non-sending user messages
            <div
              className={cn(
                'absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10', // Z-index to ensure clickable
                message.status === 'error'
                  ? 'opacity-100 group-hover:opacity-100'
                  : '', // Always show actions on error
              )}
            >
              {message.status !== 'error' &&
                onEdit && ( // Allow edit only for sent messages (not error/sending)
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 text-muted-foreground hover:text-foreground p-0.5"
                    onClick={() => onEdit(message)}
                    aria-label="Edit message"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.862 2.276a2.25 2.25 0 013.126 3.126L15.036 12.21l-3.126-3.126zm0 0L13.5 14.172V17.5h3.328l2.914-2.914Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </Button>
                )}
              {onDelete && ( // Always allow delete for user messages
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6 text-muted-foreground hover:text-destructive p-0.5"
                  onClick={() => onDelete(message.timestamp)}
                  aria-label="Delete message"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}

        {/* Error State Display */}
        {message.status === 'error' ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-destructive text-xs italic font-medium">
              {' '}
              {/* Changed color for better visibility */}
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
              {/* Show retry info only if retry count > 0 */}
              {message.retryCount && message.retryCount > 0
                ? ` (Attempt ${message.retryCount}/${message.retryLimit ?? ConfigRetryLimit})`
                : ''}
            </p>
            {/* Render original content slightly faded */}
            {/* Ensure renderMessage is safe for content with errors */}
            <div className="prose prose-sm max-w-none dark:prose-invert opacity-75">
              {renderMessage(message.content)}
            </div>
            {/* Action Buttons for Error State */}
            <div className="flex items-center gap-3 mt-1 border-t border-border pt-1.5">
              {canRetry && onRetry && (
                <button
                  onClick={() => onRetry(message)} // Pass the message object to the retry handler
                  className="text-secondary-foreground hover:text-primary font-medium focus:outline-none focus:underline text-xs" // Added text-xs
                  aria-label="Retry sending message"
                >
                  {' '}
                  <RotateCcw className="w-3 h-3 inline-block mr-1" /> Retry
                </button>
              )}
              {/* Delete button is now also available via the absolute positioned actions */}
              {/* Kept here for redundancy/visibility in error state if absolute positioning is missed */}
              {onDelete && (
                <button
                  onClick={() => onDelete(message.timestamp)}
                  className="text-destructive hover:text-destructive-foreground font-medium focus:outline-none focus:underline text-xs" // Added text-xs
                  aria-label="Delete message"
                >
                  <Trash2 className="w-3 h-3 inline-block mr-1" /> Delete
                </button>
              )}
            </div>
          </div>
        ) : (
          // Default Message Display (status is 'sent' or 'sending')
          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2 prose-blockquote:my-2 prose-pre:my-2">
            {/* Render message content using Markdown, handling previews */}
            {renderMessage(message.content)}
            {/* Sending Indicator */}
            {message.status === 'sending' &&
              !isUser && ( // Only show for assistant while loading
                <span className="text-xs italic opacity-70 ml-2">
                  (Generating...)
                </span>
              )}
            {/* Timestamp */}
            <span className="block text-right text-xs text-muted-foreground mt-1">
              {message.isEdited && '(Edited) '}
              {new Intl.DateTimeFormat('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
              }).format(new Date(message.timestamp))}
            </span>

            {/* "Prompts to Try" section for greeting message */}
            {message.isGreeting && onPromptClick && (
              <div className="mt-3 pt-3 border-t border-border/50">
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
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-sm font-bold flex-shrink-0 ml-2">
          {' '}
          {/* Changed user avatar color */}
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
  // The children prop for a code block usually contains a single string node
  const codeContent = Array.isArray(children)
    ? children.map(String).join('')
    : String(children);

  // If this is an inline code element, just render the code tag
  if (!className) {
    return <code>{codeContent}</code>;
  }

  // For block code handled by Prism, render the code tag inside pre
  // The `PreElementRenderer` wraps the `pre` tag, so this just renders the `code`
  // with the correct language class for Prism.
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
  // Extract language from the HAST node structure.
  // Look for a `code` child node and its `className` property.
  const codeNode = node?.children?.find(
    (child) => child.type === 'element' && child.tagName === 'code',
  ) as HastElement | undefined;
  const languageClass = codeNode?.properties?.className as string[] | undefined;
  const language = languageClass
    ?.find((cls) => cls.startsWith('language-'))
    ?.substring(9); // Extract language name (e.g., 'javascript')

  // Handle specific preview types based on language
  if (language === 'mermaid' && codeNode) {
    // Extract the raw code content from the code node children
    const rawMermaidCode = hastToString(codeNode).trim();
    return <MermaidDiagram chart={rawMermaidCode} />;
  }

  // Note: HTML and JSON previews are handled *before* ReactMarkdown rendering
  // by the `renderMessage` function using regex splitting. If an ```html or ```json
  // block were *not* caught by `renderMessage`'s regex (e.g., due to malformed syntax),
  // it would fall through here and be rendered as a standard syntax-highlighted code block,
  // which is a reasonable fallback.

  // Default pre rendering for other code blocks (e.g., js, python, plaintext)
  // This wrapper provides styling and positioning for the copy button.
  return (
    <div className="code-block-wrapper group/codeblock relative my-4">
      <pre className="bg-muted text-foreground rounded-md p-3 overflow-x-auto">
        {/* PrismJS adds its classes and spans inside the `code` tag */}
        {children}
      </pre>
      {/* Copy button positioned absolutely relative to the wrapper div */}
      <div className="absolute top-2 right-2 opacity-0 group-hover/codeblock:opacity-100 transition-opacity z-10">
        {/* Extract the text content of the code block for copying */}
        <CopyMarkdownButton
          content={codeNode ? hastToString(codeNode).trim() : ''}
        />
      </div>
    </div>
  );
};

// Renders message content, splitting out specific HTML/JSON blocks for previews
// and rendering the rest as standard markdown.
const renderMessage = (content: string): JSX.Element => {
  const parts: JSX.Element[] = [];
  let lastIndex = 0;

  // Regex to find specific code blocks we want to render as previews: ```html...``` or ```json...```
  // This regex captures the language (html or json) and the content within the block.
  // Use the 'g' flag for global matching.
  const previewBlockRegex = /```(html|json)\n([\s\S]*?)\n```/g;
  let match;

  // Iterate through all matches of the preview block regex
  while ((match = previewBlockRegex.exec(content)) !== null) {
    const [fullMatch, lang, codeContent] = match;
    const startIndex = match.index;
    const endIndex = previewBlockRegex.lastIndex;

    // 1. Add the text/markdown content *before* the current match
    if (startIndex > lastIndex) {
      const textBefore = content.substring(lastIndex, startIndex);
      // Render the text before the match as standard markdown
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
            // Use custom renderers for pre/code within these markdown sections
            pre: PreElementRenderer,
            code: CodeElementRenderer,
            // Add other custom components if needed for inline elements etc.
          }}
        >
          {textBefore}
        </ReactMarkdown>,
      );
    }

    // 2. Add the specific preview component for the matched code block
    if (lang === 'html') {
      parts.push(
        <HtmlPreview
          key={`html-preview-${startIndex}`}
          htmlContent={codeContent} // Pass the extracted code content
        />,
      );
    } else if (lang === 'json') {
      parts.push(
        <JsonViewer
          key={`json-viewer-${startIndex}`}
          jsonContent={codeContent} // Pass the extracted code content
        />,
      );
    }

    // Update the last index to continue searching after the current match
    lastIndex = endIndex;
  }

  // 3. Add any remaining text/markdown content *after* the last match
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
          pre: PreElementRenderer,
          code: CodeElementRenderer,
        }}
      >
        {textAfter}
      </ReactMarkdown>,
    );
  }

  // If no special preview code blocks were found by the regex,
  // render the entire content as a single standard markdown block.
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
          pre: PreElementRenderer,
          code: CodeElementRenderer,
        }}
      >
        {content}
      </ReactMarkdown>
    );
  }

  // Render all collected parts in order
  return <>{parts}</>;
};
