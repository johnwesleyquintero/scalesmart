'use client';
import MessageBubble from './MessageBubble';
import MessageContent from './MessageContent'; // Import MessageContent
import ChatInput from './ChatInput'; // Import ChatInput component
import { RETRY_LIMIT as ConfigRetryLimit } from '@/lib/config';
import DOMPurify from 'dompurify';
import React, { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  initializeDB,
  setItem,
  getChatMessagesBySession, // Keep getChatMessagesBySession
  ChatMessageRecord,
} from '@/lib/indexeddb-service';
import { Message, mapMessageRoleToSender } from '@/lib/chat-message-utils';
import {
  ChatState,
  ChatAction,
  initialState,
  chatReducer,
} from '@/lib/chat-reducer';
import { fetchAndProcessChatApi } from '@/lib/chat-api-helpers';

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
import suggestedPrompts from '@/app/chat/data/suggested-prompts.json'; // Import suggested prompts
import {
  RotateCcw,
  Trash2,
  Maximize,
  Minimize,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import CopyMarkdownButton from './CopyMarkdownButton';
import { toString as hastToString } from 'hast-util-to-string'; // For extracting raw code
import { Button } from '@/components/ui/button'; // Assuming this is a local Button component
import { cn } from '@/lib/utils'; // For conditional class names
import { useToast } from '@/components/ui/use-toast'; // Import useToast hook

// --- Interfaces ---
interface MessageBubbleProps {
  message: Message;
  onRetry?: (content: string, messageToRetry: Message) => void;
  onDelete?: (timestamp: number) => void;
  onPromptClick?: (promptText: string) => void; // For "Prompts to Try"
  onEdit?: (message: Message) => void;
}

// --- Constants ---
const DEFAULT_RETRY_LIMIT = 3;

const initialGreeting: Message = {
  id: crypto.randomUUID(), // Give the greeting a stable ID
  role: 'assistant',
  content:
    "Hey there! I'm WesAI.\n\n" +
    'I can turn your raw data into insights! or try one of these prompts:',
  timestamp: Date.now(),
  status: 'sent',
  isGreeting: true, // Mark this as the greeting message
};

// --- Main Chat Component ---
export default function ChatInterface() {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { toast } = useToast(); // Initialize useToast hook
  const {
    messages,
    input,
    isLoading,
    isChatOpen,
    isFullScreen,
    editingMessage,
    mode,
    isSidebarOpen, // Destructure isSidebarOpen from state
  } = state;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load and shuffle prompts on component mount or when prompts change (though they are static here)
  const [displayedPrompts, setDisplayedPrompts] = React.useState<string[]>([]);

  useEffect(() => {
    // Shuffle and select a subset (e.g., 4 prompts)
    const shuffledPrompts = suggestedPrompts.sort(() => 0.5 - Math.random());
    setDisplayedPrompts(shuffledPrompts.slice(0, 4)); // Display up to 4 random prompts
  }, []); // Empty dependency array means this runs once on mount

  // --- Helper Functions ---

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
        if (dbMessages.length > 0) {
          const { mapDbRecordToMessage } = await import(
            '@/lib/chat-message-utils'
          );
          const mappedMessages = dbMessages.map(mapDbRecordToMessage);
          dispatch({ type: 'SET_MESSAGES', payload: mappedMessages });
          console.log('ChatInterface: Messages loaded from IndexedDB.');
        } else {
          // If no messages, add the initial greeting
          dispatch({ type: 'ADD_MESSAGE', payload: initialGreeting });
        }
      } catch (error) {
        console.error('ChatInterface: Error in loadMessages:', error);
        toast({
          title: 'Error loading chat history',
          description: 'Could not load messages from local storage.',
          variant: 'destructive',
        });
      }
    };
    // Effect should only run once on mount. New sessions handled by resetChat.
    loadMessages();
  }, [toast]); // Add toast to dependencies

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
            sessionId: chatSessionIdRef.current, // Add sessionId
            sender: mapMessageRoleToSender(message.role), // Map Message.role to ChatMessageRecord.sender
            text: message.content, // Map Message.content to ChatMessageRecord.text
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

          // Simple approach: save all current messages for the session ID.
          // Use a transaction for robustness if clearing/replacing per session
          // but iterating and putting items by ID is usually safer and updates in place.
          for (const messageDataPayload of messagesToSave) {
            try {
              await setItem(
                'chatMessages',
                messageDataPayload.id,
                messageDataPayload,
              );
            } catch (error) {
              console.error(
                `ChatInterface: Failed to save message ${messageDataPayload.id} to IndexedDB:`,
                error,
              );
              toast({
                title: 'Error saving message',
                description: `Failed to save message ${messageDataPayload.id} to local storage.`,
                variant: 'destructive',
              });
            }
          }
          console.log(
            `ChatInterface: ${messages.length} messages saved to IndexedDB for session ${chatSessionIdRef.current}.`,
          );
        }
      }, 500); // Debounce for 500ms

      return () => clearTimeout(handler);
    };

    if (messages.length > 0) {
      saveMessages();
    }
  }, [messages, toast]);

  // Function to handle sending a message
  const sendMessage = useCallback(
    async (messageContent: string, isRetry: boolean = false) => {
      if (!messageContent.trim()) return;

      dispatch({ type: 'SET_INPUT', payload: '' }); // Clear input immediately

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageContent,
        timestamp: Date.now(),
        status: 'sent',
      };

      dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
      dispatch({ type: 'SET_LOADING', payload: true });

      // Add a placeholder for the assistant's response immediately
      const assistantPlaceholder: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '...', // Placeholder content
        timestamp: Date.now(),
        status: 'pending',
        metadata: { originalUserMessageId: userMessage.id }, // Link to the user message
      };
      dispatch({ type: 'ADD_MESSAGE', payload: assistantPlaceholder });

      try {
        // Correct arguments for fetchAndProcessChatApi
        await fetchAndProcessChatApi(
          userMessage, // Pass the user message object
          assistantPlaceholder, // Pass the assistant placeholder message object
          ConfigRetryLimit || DEFAULT_RETRY_LIMIT, // Pass the effective retry limit
          dispatch, // Pass the dispatch function
          scrollToBottom, // Pass the scrollToBottom function
          mode, // Pass the current mode
          messages, // Pass the current messages as history
        );
      } catch (error) {
        console.error('API call failed:', error);
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: {
            id: assistantPlaceholder.id,
            updates: {
              status: 'failed',
              error: 'Failed to get a response. Please try again.',
            },
          },
        });
        toast({
          title: 'Message failed',
          description:
            'Failed to get a response from the AI. Please try again.',
          variant: 'destructive',
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [dispatch, scrollToBottom, mode, messages, toast], // Add messages and toast to dependencies
  );

  // Function to handle retrying a message
  const handleRetry = useCallback(
    (content: string, messageToRetry: Message) => {
      // Increment retry count and update status
      const updatedMessage: Message = {
        ...messageToRetry,
        retryCount: (messageToRetry.retryCount || 0) + 1,
        status: 'retrying',
        error: undefined, // Clear previous error
      };

      dispatch({
        type: 'UPDATE_MESSAGE',
        payload: { id: updatedMessage.id, updates: updatedMessage },
      });

      // If retry limit is reached, display an error and do not send
      const currentRetryLimit =
        messageToRetry.retryLimit || DEFAULT_RETRY_LIMIT;
      if ((updatedMessage.retryCount ?? 0) > currentRetryLimit) {
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: {
            id: updatedMessage.id, // Use id
            updates: {
              status: 'failed',
              error: `Retry limit (${currentRetryLimit}) exceeded. Please try a different prompt.`, // More specific error
            },
          },
        });
        toast({
          title: 'Retry limit exceeded',
          description: `Failed to get a response after ${currentRetryLimit} retries. Please try a different prompt.`,
          variant: 'destructive',
        });
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      // Find the original user message that triggered the failed assistant message
      const originalUserMessage = messages.find(
        (msg) => msg.id === messageToRetry.metadata?.originalUserMessageId,
      );

      if (originalUserMessage) {
        sendMessage(originalUserMessage.content, true); // Re-send the original user message
      } else {
        // Fallback: if original user message not found, retry with the assistant's content (shouldn't happen if logic is correct)
        sendMessage(content, true);
      }
    },
    [sendMessage, messages, dispatch, toast],
  );

  // Function to handle deleting a message
  const handleDelete = useCallback(
    async (timestamp: number) => {
      dispatch({ type: 'REMOVE_MESSAGE', payload: timestamp });
      // Optionally, delete from IndexedDB here as well
    },
    [dispatch],
  );

  // Function to handle editing a message
  const handleEdit = useCallback(
    (message: Message) => {
      dispatch({ type: 'SET_EDITING_MESSAGE', payload: message });
      dispatch({ type: 'SET_INPUT', payload: message.content });
      textareaRef.current?.focus();
    },
    [dispatch],
  );

  // Function to submit edited message
  const submitEdit = useCallback(() => {
    if (editingMessage && input.trim()) {
      dispatch({
        type: 'UPDATE_MESSAGE',
        payload: {
          id: editingMessage.id, // Use id
          updates: {
            content: input.trim(),
            isEdited: true,
            editedAt: Date.now(),
          },
        },
      });
      dispatch({ type: 'SET_EDITING_MESSAGE', payload: null });
      dispatch({ type: 'SET_INPUT', payload: '' });
    }
  }, [editingMessage, input, dispatch]);

  // Function to cancel editing
  const cancelEdit = useCallback(() => {
    dispatch({ type: 'SET_EDITING_MESSAGE', payload: null });
    dispatch({ type: 'SET_INPUT', payload: '' });
  }, [dispatch]);

  // Function to handle prompt clicks (for "Prompts to Try")
  const handlePromptClick = useCallback(
    (promptText: string) => {
      dispatch({ type: 'SET_INPUT', payload: promptText });
      textareaRef.current?.focus();
    },
    [dispatch],
  );

  // Remove custom markdown rendering components defined here

  return (
    <div className="flex h-full pt-24 pb-24">
      {' '}
      {/* Adjusted padding-top and added padding-bottom */}
      {/* Left Sidebar */}
      <div
        className={cn(
          'bg-gray-100 dark:bg-gray-800 p-4 border-r border-border flex flex-col transition-all duration-300 ease-in-out',
          isSidebarOpen ? 'w-64' : 'w-16 overflow-hidden', // Adjust width based on state
        )}
      >
        <div className="text-lg font-bold mb-4 text-foreground">WesAI</div>
        <nav className="space-y-2">
          <a
            href="#"
            className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-message-square"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {isSidebarOpen && <span>Chat</span>}
          </a>
          <a
            href="#"
            className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-users"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87 4 4 0 0 0-7-1.13" />
              <circle cx="16" cy="7" r="4" />
            </svg>
            {isSidebarOpen && <span>Agents</span>}
            {isSidebarOpen && (
              <span className="ml-auto bg-blue-200 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-blue-700 dark:text-blue-100">
                Beta
              </span>
            )}
          </a>
          <a
            href="#"
            className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-book"
            >
              <path d="M4 19.5v-15A2.5 2 0 0 1 6.5 2H20v20H6.5a2.5 2 0 0 1 0-5H20" />
            </svg>
            {isSidebarOpen && <span>Libraries</span>}
            {isSidebarOpen && (
              <span className="ml-auto bg-blue-200 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-blue-700 dark:text-blue-100">
                Beta
              </span>
            )}
          </a>
          <a
            href="#"
            className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-plug-zap"
            >
              <path d="M12 22v-5" />
              <path d="M9 18v-3" />
              <path d="M15 18v-3" />
              <path d="M12 12V2" />
              <path d="M4 9h16" />
              <path d="M12 2a7 7 0 1 0 7 7Z" />
              <path d="m13 10-1 3-3-1" />
            </svg>
            {isSidebarOpen && <span>Connections</span>}
            {isSidebarOpen && (
              <span className="ml-auto bg-blue-200 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-blue-700 dark:text-blue-100">
                Beta
              </span>
            )}
          </a>
        </nav>
        <div className="mt-auto space-y-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              className="w-full p-2 pl-10 rounded-md bg-gray-200 dark:bg-gray-700 text-foreground placeholder-gray-500"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          {isSidebarOpen && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Ctrl-K
            </div>
          )}
        </div>
      </div>
      {/* Main Chat Area */}
      <div
        className={cn(
          'flex h-full flex-col overflow-hidden rounded-lg border bg-background shadow-xl transition-all duration-300 ease-in-out', // Added transition
          isSidebarOpen ? 'w-[calc(100vw-280px)]' : 'w-[calc(100vw-80px)]',
          'mx-auto max-w-4xl', // Added for centering and max-width
        )}
      >
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Chat</h2>
          {/* Session indicator */}
          <div className="text-sm text-muted-foreground ml-4">
            Session saved
          </div>
          {/* Mode Selector */}
          <div className="flex items-center space-x-2 ml-auto">
            {' '}
            {/* Added ml-auto to push to the right */}
            <span className="text-sm text-muted-foreground">
              Mode: {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </span>{' '}
            {/* Display current mode */}
            <Button
              variant={mode === 'default' ? 'secondary' : 'ghost'} // Highlight active mode
              size="sm" // Smaller size for mode buttons
              onClick={() => dispatch({ type: 'SET_MODE', payload: 'default' })}
            >
              Default
            </Button>
            <Button
              variant={mode === 'content' ? 'secondary' : 'ghost'} // Highlight active mode
              size="sm" // Smaller size for mode buttons
              onClick={() => dispatch({ type: 'SET_MODE', payload: 'content' })}
            >
              Content
            </Button>
            <Button
              variant={mode === 'code' ? 'secondary' : 'ghost'} // Highlight active mode
              size="sm" // Smaller size for mode buttons
              onClick={() => dispatch({ type: 'SET_MODE', payload: 'code' })}
            >
              Code
            </Button>
          </div>
          <div className="flex space-x-2 ml-4">
            {' '}
            {/* Added ml-4 for spacing */}
            {/* Sidebar Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
              title={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeftOpen className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={resetChat}
              title="New Chat"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => dispatch({ type: 'TOGGLE_FULLSCREEN' })}
              title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullScreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Message Display Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id || index}
              message={message}
              onRetry={handleRetry}
              onDelete={handleDelete}
              onPromptClick={handlePromptClick}
              onEdit={handleEdit}
            >
              {/* Use MessageContent component for markdown rendering */}
              <MessageContent content={message.content} />
            </MessageBubble>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Area */}
        <ChatInput
          input={input}
          setInput={(input: string) =>
            dispatch({ type: 'SET_INPUT', payload: input })
          }
          sendMessage={sendMessage}
          isLoading={isLoading}
          editingMessage={editingMessage}
          submitEdit={submitEdit}
          cancelEdit={cancelEdit}
          displayedPrompts={displayedPrompts}
          handlePromptClick={handlePromptClick}
          messagesLength={messages.length}
          isGreetingMessage={
            messages.length === 1 && Boolean(messages[0].isGreeting)
          }
        />
      </div>
    </div>
  );
}

// Floating Chat Button
export function FloatingChatButton({
  toggleChatAction,
  isChatOpen,
}: {
  toggleChatAction: () => void;
  isChatOpen: boolean;
}) {
  return (
    <button
      onClick={toggleChatAction}
      className={cn(
        'fixed bottom-4 right-4 z-50 rounded-full bg-blue-600 p-3 text-white shadow-lg transition-all duration-300 ease-in-out hover:bg-blue-700',
        isChatOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100',
      )}
      title="Open Chat"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.75 9.75 0 01-6.79-2.916M21 12c0-4.556-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.484M3 12c0 4.556 4.03 8.25 9 8.25s9-3.694 9-8.25M18.75 12h.008v.008h-.008V12zm-4.5 0h.008v.008h-.008V12zm-4.5 0h.008v.008h-.008V12z"
        />
      </svg>
    </button>
  );
}
