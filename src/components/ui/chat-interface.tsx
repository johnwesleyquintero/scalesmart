'use client';
import MessageBubble from './MessageBubble';
import { RETRY_LIMIT as ConfigRetryLimit } from '@/lib/config';
import DOMPurify from 'dompurify';
import React, { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  initializeDB,
  setItem,
  bulkSetItems,
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
import { RotateCcw, Trash2, Maximize, Minimize } from 'lucide-react';
import CopyMarkdownButton from './CopyMarkdownButton';
import { toString as hastToString } from 'hast-util-to-string'; // For extracting raw code
import { Button } from '@/components/ui/button'; // Assuming this is a local Button component
import { cn } from '@/lib/utils'; // For conditional class names

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
    'I can help you with app building, data analysis, and general assistance.\n\n' +
    'To get started, type your request in the chat box and press Enter. You can also click the "Prompts to Try" button to see examples of what I can do.\n\n' +
    'For more information about my capabilities, click the "?" button in the top right corner of the chat box.\n\n' +
    'Have fun!',
  timestamp: Date.now(),
  status: 'sent',
  isGreeting: true, // Mark this as the greeting message
};

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
      }
    };
    // Effect should only run once on mount. New sessions handled by resetChat.
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
          const messagesToSave = messages.map((message) => ({
            id: message.id!,
            chatSessionId: chatSessionIdRef.current,
            role: message.role,
            content: message.content,
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

          try {
            await bulkSetItems('chatMessages', messagesToSave);
          } catch (error) {
            console.error(
              'ChatInterface: Failed to save messages to IndexedDB:',
              error,
            );
          }
          console.log(
            `ChatInterface: ${messages.length} messages saved to IndexedDB for session ${chatSessionIdRef.current}.`,
          );
        }
      }, 500); // Debounce for 500ms

      return () => clearTimeout(handler); // Cleanup timeout on effect re-run or unmount
    };
    // Only run saveMessages if there are messages to save, or when chat is closed (to save final state)
    if (messages.length > 0 || !isChatOpen) {
      // The debounce handles frequent updates, but save only if there's content or closing.
      // A better trigger might be when a message status changes to 'sent' or 'error'.
      // For now, triggering on any messages array change + chat open state.
      saveMessages();
    }
  }, [messages, isChatOpen]); // Run whenever messages array or chat open state changes

  // Send initial greeting if chat is opened and empty
  useEffect(() => {
    // Check if chat is open, there are no user/assistant messages (allow only the greeting),
    // not currently loading, and a greeting hasn't already been added (by checking messages.length or isGreeting flag)
    const hasUserOrAssistantMessages = messages.some(
      (msg) =>
        msg.role === 'user' || (msg.role === 'assistant' && !msg.isGreeting),
    );

    if (
      isChatOpen &&
      messages.length === 0 && // Simpler check: if messages is empty
      !isLoading // Avoid sending greeting while something else is pending
    ) {
      // Add greeting only if messages array is empty on chat open
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

  // Effect to manage global isLoading state based on message statuses
  useEffect(() => {
    const anyMessageSending = messages.some((msg) => msg.status === 'sending');
    // Update loading state only if it needs to change
    if (state.isLoading !== anyMessageSending) {
      console.log(`Setting isLoading: ${anyMessageSending}`);
      dispatch({ type: 'SET_LOADING', payload: anyMessageSending });
    }
  }, [messages, dispatch, state.isLoading]); // Depend on messages and current loading state

  // --- Message Handling Logic ---

  // Helper to determine the effective retry limit for a message
  // ConfigRetryLimit is imported, assuming it's a constant, so it doesn't need to be a dependency.
  const determineEffectiveRetryLimit = useCallback(
    (message?: Message): number => {
      // Use message-specific limit if provided, otherwise use config, default to 3
      return message?.retryLimit ?? ConfigRetryLimit ?? DEFAULT_RETRY_LIMIT;
    },
    [], // ConfigRetryLimit is a constant import, no dependency needed
  );

  // Function to handle saving an edited message
  const handleSaveEdit = useCallback(
    (timestamp: number, newContent: string) => {
      if (input.trim() === '') {
        alert('Edited message cannot be empty.');
        return;
      }

      // Find the original message to get its role
      const originalMessage = messages.find(
        (msg) => msg.timestamp === timestamp,
      );

      if (!originalMessage) {
        console.error('Attempted to save edit on non-existent message.');
        dispatch({ type: 'SET_EDITING_MESSAGE', payload: null });
        dispatch({ type: 'SET_INPUT', payload: '' });
        return;
      }

      dispatch({
        type: 'UPDATE_MESSAGE',
        payload: {
          id: originalMessage.id,
          updates: {
            content: newContent.trim(),
            isEdited: true,
            editedAt: Date.now(),
            // Reset status and error if it was an error message being edited for retry
            status: 'sent',
            error: undefined,
            // Keep retryCount? Or reset? Resetting might be safer for edited content.
            // Let's reset retryCount to 0 for an edited message.
            retryCount: 0,
          },
        },
      });

      // Clear editing state and input
      dispatch({ type: 'SET_EDITING_MESSAGE', payload: null });
      dispatch({ type: 'SET_INPUT', payload: '' });

      // If the edited message was a user message, trigger a new AI response
      if (originalMessage.role === 'user') {
        const editedUserMessage: Message = {
          ...originalMessage,
          content: newContent.trim(), // Use the new content
          isEdited: true,
          editedAt: Date.now(),
          status: 'sending', // Status becomes sending for the new API call
          error: undefined,
          retryCount: 0, // Start retry count over for edited message
          retryLimit: determineEffectiveRetryLimit(), // Use default limit for edited message attempt
        };
        // Update message state again to show 'sending' status
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: {
            id: editedUserMessage.id,
            updates: {
              status: editedUserMessage.status,
              error: editedUserMessage.error,
              retryCount: editedUserMessage.retryCount,
            },
          },
        });
        // Start AI response generation for the edited message
        const aiRespondingMessage: Message = {
          id: `ai-responding-${Date.now()}`,
          timestamp: Date.now() + 1, // Ensure it's after user message
          role: 'assistant', // Use role instead of sender
          content: '...', // Placeholder for streaming content
          status: 'responding',
        };
        dispatch({ type: 'ADD_MESSAGE', payload: aiRespondingMessage });
        scrollToBottom();

        fetchAndProcessChatApi(
          editedUserMessage,
          aiRespondingMessage,
          determineEffectiveRetryLimit(editedUserMessage),
          dispatch,
          scrollToBottom,
          mode,
          messages, // Pass the current messages as history
        );
      }
    },
    [
      input,
      messages,
      dispatch,
      determineEffectiveRetryLimit,
      scrollToBottom,
      mode,
    ],
  );

  // Function to handle sending a new message
  const handleSend = useCallback(async () => {
    if (input.trim() === '' || isLoading) {
      return; // Prevent sending empty messages or sending while loading
    }

    // If editing a message, handle the edit instead of sending a new one
    if (editingMessage) {
      handleSaveEdit(editingMessage.timestamp, input);
      return;
    }

    // Create the new user message
    const newUserMessage: Message = {
      id: crypto.randomUUID(), // Generate unique ID for the user message
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
      status: 'sending', // Initial status is sending
      retryCount: 0, // First attempt is retryCount 0
      retryLimit: determineEffectiveRetryLimit(), // Use default limit for new messages
    };

    // Add the new user message to the state
    dispatch({ type: 'ADD_MESSAGE', payload: newUserMessage });
    dispatch({ type: 'SET_INPUT', payload: '' });
    scrollToBottom();

    // Start AI response generation
    const aiRespondingMessage: Message = {
      id: `ai-responding-${Date.now()}`,
      timestamp: Date.now() + 1, // Ensure it's after user message
      role: 'assistant', // Use role instead of sender
      content: '...', // Placeholder for streaming content
      status: 'responding',
    };
    dispatch({ type: 'ADD_MESSAGE', payload: aiRespondingMessage });
    scrollToBottom();

    // Determine the effective retry limit
    const effectiveRetryLimit = determineEffectiveRetryLimit(newUserMessage); // Pass the full message object

    fetchAndProcessChatApi(
      newUserMessage,
      aiRespondingMessage,
      effectiveRetryLimit,
      dispatch,
      scrollToBottom,
      mode,
      messages, // Pass the current messages as history
    );
  }, [
    input,
    isLoading,
    editingMessage,
    handleSaveEdit,
    dispatch,
    scrollToBottom,
    determineEffectiveRetryLimit,
    mode,
    messages, // Added messages dependency
  ]);

  // Function to handle retrying a message
  const handleRetry = useCallback(
    (content: string, messageToRetry: Message) => {
      // Adjust signature to match MessageBubbleProps
      console.log('Retrying message:', messageToRetry);
      // Create a new AI responding message for the retry
      const aiRespondingMessage: Message = {
        id: `ai-responding-${Date.now()}`,
        timestamp: Date.now() + 1, // Ensure it's after user message
        role: 'assistant', // Use role instead of sender
        content: '...', // Placeholder for streaming content
        status: 'responding',
      };
      dispatch({ type: 'ADD_MESSAGE', payload: aiRespondingMessage });
      scrollToBottom();

      // Determine the effective retry limit for the retried message
      const effectiveRetryLimit = determineEffectiveRetryLimit(messageToRetry); // Pass the full message object

      fetchAndProcessChatApi(
        messageToRetry,
        aiRespondingMessage,
        effectiveRetryLimit,
        dispatch,
        scrollToBottom,
        mode,
        messages, // Pass the current messages as history
      );
    },
    [dispatch, scrollToBottom, determineEffectiveRetryLimit, mode, messages], // Added messages dependency
  );

  // Function to handle deleting a message
  const handleDelete = useCallback(
    (timestamp: number) => {
      dispatch({ type: 'REMOVE_MESSAGE', payload: timestamp });
    },
    [dispatch],
  );

  // Function to handle prompt clicks (from "Prompts to Try")
  const handlePromptClick = useCallback(
    (promptText: string) => {
      dispatch({ type: 'SET_INPUT', payload: promptText });
      // Optionally, automatically send the prompt
      // handleSend(); // This would trigger an immediate send
    },
    [dispatch],
  );

  // Function to handle editing a message
  const handleEdit = useCallback(
    (messageToEdit: Message) => {
      dispatch({ type: 'SET_EDITING_MESSAGE', payload: messageToEdit });
      // Input field is set by SET_EDITING_MESSAGE reducer logic
    },
    [dispatch],
  );

  // Function to cancel editing
  const handleCancelEdit = useCallback(() => {
    dispatch({ type: 'SET_EDITING_MESSAGE', payload: null });
    dispatch({ type: 'SET_INPUT', payload: '' });
  }, [dispatch]);

  // Function to handle input changes
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      dispatch({ type: 'SET_INPUT', payload: e.target.value });
    },
    [dispatch],
  );

  // Function to handle key presses (e.g., Enter to send)
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Prevent new line
        handleSend();
      }
    },
    [handleSend],
  );

  // Function to toggle chat visibility
  const toggleChat = useCallback(() => {
    dispatch({ type: 'TOGGLE_CHAT' });
  }, [dispatch]);

  // Function to toggle fullscreen mode
  const toggleFullScreen = useCallback(() => {
    dispatch({ type: 'TOGGLE_FULLSCREEN' });
  }, [dispatch]);

  // Function to toggle agent mode
  const toggleMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_MODE' });
  }, [dispatch]);

  // Render logic
  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 flex flex-col rounded-lg shadow-lg transition-all duration-300 ease-in-out',
        isFullScreen ? 'h-screen w-screen' : 'h-[600px] w-[400px]',
        isChatOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0',
      )}
    >
      {/* Chat Header */}
      <div className="flex items-center justify-between rounded-t-lg bg-gray-800 p-3 text-white">
        <h2 className="text-lg font-semibold">WesAI Chat</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMode}
            title={`Current Mode: ${mode}`}
            className="text-white hover:bg-gray-700"
          >
            {mode === 'default' && 'D'}
            {mode === 'code' && 'X'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullScreen}
            title={isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="text-white hover:bg-gray-700"
          >
            {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={resetChat}
            title="Reset Chat"
            className="text-white hover:bg-gray-700"
          >
            <RotateCcw size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleChat}
            title="Close Chat"
            className="text-white hover:bg-gray-700"
          >
            <Trash2 size={20} />
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <div
        className="flex-1 overflow-y-auto p-4"
        ref={messagesEndRef}
        role="list"
      >
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id || message.timestamp} // Use ID if available, fallback to timestamp
            message={message}
            onRetry={handleRetry}
            onDelete={handleDelete}
            onPromptClick={handlePromptClick}
            onEdit={handleEdit}
          />
        ))}
      </div>

      {/* Chat Input */}
      <div className="border-t border-gray-700 p-4">
        {editingMessage && (
          <div className="mb-2 flex items-center justify-between rounded-md bg-yellow-100 p-2 text-sm text-yellow-800">
            <span>
              Editing message from{' '}
              {editingMessage.role === 'user' ? 'You' : 'WesAI'}:
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelEdit}
              className="text-yellow-800 hover:bg-yellow-200"
            >
              Cancel
            </Button>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <textarea
            ref={textareaRef}
            className="flex-1 resize-none overflow-hidden rounded-lg border border-gray-600 bg-gray-700 p-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            placeholder={
              isLoading ? 'Waiting for response...' : 'Type your message...'
            }
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            // Start with 1 row, auto-resize will adjust
            rows={1}
            disabled={isLoading} // Disable input while loading
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || input.trim() === ''}
          >
            {editingMessage ? 'Save Edit' : 'Send'}
          </Button>
        </div>
        {/* Prompts to Try */}
        {messages.length <= 1 && !isLoading && (
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-400">
              Prompts to Try:
            </h3>
            <div className="flex flex-wrap gap-2">
              {[].map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePromptClick(prompt)}
                  className="text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}
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
