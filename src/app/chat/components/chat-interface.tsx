'use client';
import MessageBubble from './MessageBubble';
import MessageContent from './MessageContent'; // Import MessageContent
import ChatInput from './ChatInput'; // Import ChatInput component
// import { RETRY_LIMIT as ConfigRetryLimit } from '@/lib/config'; // Remove this line
import DOMPurify from 'dompurify';
import React, { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  ChatMessageRecord,
  clearAllChatSessions,
  getChatMessagesBySession,
} from '@/lib/indexeddb-service'; // Keep these for now, will refine later
import {
  getAllChatSessionIds, // Import the new function
  clearChatSession, // Import the new function
} from '@/lib/indexeddb/chat-db'; // Import from chat-db.ts
import {
  Message,
  mapMessageRoleToSender,
  mapDbRecordToMessage,
} from '@/lib/chat-message-utils';
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
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
} from 'lucide-react';
import CopyMarkdownButton from './CopyMarkdownButton';
import { toString as hastToString } from 'hast-util-to-string'; // For extracting raw code
import { Button } from '@/components/ui/button'; // Assuming this is a local Button component
import { cn } from '@/lib/utils'; // For conditional class names
import { useToast } from '@/components/ui/use-toast'; // Import useToast hook
import { useSearchParams } from 'next/navigation';

// --- Interfaces ---
interface MessageBubbleProps {
  message: Message;
  onRetry?: (content: string, messageToRetry: Message) => void;
  onDelete?: (timestamp: number) => void;
  onPromptClick?: (promptText: string) => void; // For "Prompts to Try"
  onEdit?: (message: Message) => void;
}

// --- Constants ---
// const DEFAULT_RETRY_LIMIT = 3; // This line is now replaced by the import
import { DEFAULT_RETRY_LIMIT } from '@/lib/chat-constants';
import { useChatHistory } from '@/hooks/use-chat-history';

const greetings = [
  "Hey there! I'm WesAI. I can turn your raw data into insights!",
  'Hello! WesAI here, ready to help you analyze your data.',
  "Hi! I'm WesAI, your AI assistant for data insights.",
  "Greetings! WesAI at your service, let's explore your data.",
];

const getRandomGreeting = () => {
  const randomIndex = Math.floor(Math.random() * greetings.length);
  return greetings[randomIndex];
};

const initialGreeting: Message = {
  id: crypto.randomUUID(), // Give the greeting a stable ID
  role: 'assistant',
  content: getRandomGreeting() + ' or try one of these prompts:',
  timestamp: Date.now(),
  status: 'sent',
  isGreeting: true, // Mark this as the greeting message
};

// --- Main Chat Component ---
export default function ChatInterface() {
  const MESSAGE_SQUARE_ICON_CLASSES = 'h-4 w-4 mr-2';
  const JUSTIFY_BETWEEN = 'justify-between';
  const JUSTIFY_CENTER = 'justify-center';
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { toast } = useToast(); // Initialize useToast hook
  const {
    messages,
    input,
    isLoading,
    isChatOpen,

    editingMessage,
    mode,
    isSidebarOpen, // Destructure isSidebarOpen from state
  } = state;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load and shuffle prompts on component mount or when prompts change (though they are static here)
  const [displayedPrompts, setDisplayedPrompts] = React.useState<string[]>([]);
  const [chatSessions, setChatSessions] = React.useState<string[]>([]);

  // Generate a unique session ID for this chat session, persistent across renders but reset on explicit chat reset.
  const searchParams = useSearchParams();
  const [sessionIdState, setSessionIdState] = React.useState<string | null>(
    null,
  );
  const chatSessionIdRef = useRef<string | null>(null); // Initialize with null

  // Effect to set session ID on client-side only
  useEffect(() => {
    const sessionFromUrl = searchParams.get('session');
    const newSessionId = sessionFromUrl || crypto.randomUUID();
    setSessionIdState(newSessionId);
    chatSessionIdRef.current = newSessionId;
  }, [searchParams]);

  const handleMessagesLoaded = useCallback(
    (loadedMessages: Message[]) => {
      if (loadedMessages.length > 0) {
        dispatch({ type: 'SET_MESSAGES', payload: loadedMessages });
      } else {
        dispatch({ type: 'ADD_MESSAGE', payload: initialGreeting });
      }
    },
    [dispatch],
  );

  const handleSaveComplete = useCallback(() => {
    // Optional: Add a toast or log when save is complete
    console.log('Messages saved to IndexedDB.');
  }, []);

  // Only pass sessionId to useChatHistory once it's determined on the client
  const {
    saveMessages,
    loadMessages,
    clearSessionHistory: clearHookSessionHistory,
    getAllSessions,
  } = useChatHistory({
    sessionId: sessionIdState || '', // Pass a stable ID, or empty string if not yet determined
    messages: messages,
    onLoad: handleMessagesLoaded,
    onSaveComplete: handleSaveComplete,
  });

  // Function to fetch all chat sessions from IndexedDB
  const fetchAllChatSessions = useCallback(async () => {
    try {
      const sessions = await getAllChatSessionIds();
      setChatSessions(sessions);
    } catch (error) {
      console.error('Failed to fetch all chat sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat sessions.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    // Shuffle and select a subset (e.g., 4 prompts)
    const shuffledPrompts = suggestedPrompts.sort(() => 0.5 - Math.random());
    setDisplayedPrompts(shuffledPrompts.slice(0, 4)); // Display up to 4 random prompts

    // Only fetch sessions if sessionIdState is available
    if (sessionIdState) {
      fetchAllChatSessions();
    }
  }, [fetchAllChatSessions, isSidebarOpen, sessionIdState]); // Depend on sessionIdState

  // Function to reset chat (clear messages and generate new session ID)
  const resetChat = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' });
    const newSessionId = crypto.randomUUID(); // Generate a new session ID
    setSessionIdState(newSessionId); // Update state
    chatSessionIdRef.current = newSessionId; // Update ref
    console.log('Chat reset. New session ID:', newSessionId);
    // Clear editing state and input on reset
    dispatch({ type: 'SET_EDITING_MESSAGE', payload: null });
    dispatch({ type: 'SET_INPUT', payload: '' });
    clearHookSessionHistory(); // Clear history for the old session ID
    window.history.pushState({}, '', '/chat'); // Navigate to base chat URL
    fetchAllChatSessions(); // Re-fetch sessions after reset
  }, [dispatch, clearHookSessionHistory, fetchAllChatSessions]);

  // --- Chat Session Management Functions ---

  const handleSessionClick = useCallback(
    async (sessionId: string) => {
      setSessionIdState(sessionId); // Update state
      chatSessionIdRef.current = sessionId; // Update the current session ID
      dispatch({ type: 'CLEAR_MESSAGES' }); // Clear current messages
      dispatch({ type: 'SET_INPUT', payload: '' }); // Clear input
      dispatch({ type: 'SET_EDITING_MESSAGE', payload: null }); // Clear editing state

      // Reload messages for the new session
      const dbMessages = await getChatMessagesBySession(sessionId);
      if (dbMessages.length > 0) {
        const mappedMessages = dbMessages.map(mapDbRecordToMessage);
        dispatch({ type: 'SET_MESSAGES', payload: mappedMessages });
      } else {
        dispatch({ type: 'ADD_MESSAGE', payload: initialGreeting });
      }
      // Update URL without full page reload
      window.history.pushState({}, '', `/chat?session=${sessionId}`);
      toast({
        title: 'Session Loaded',
        description: `Switched to chat session: ${sessionId.substring(0, 8)}...`,
      });
      fetchAllChatSessions(); // Re-fetch sessions after loading one
    },
    [dispatch, toast, fetchAllChatSessions],
  );

  const handleClearCurrentSession = useCallback(async () => {
    if (
      window.confirm('Are you sure you want to clear the current chat session?')
    ) {
      if (sessionIdState) {
        try {
          await clearChatSession(sessionIdState); // Use the new clearChatSession
          resetChat(); // Reset the chat interface
          toast({
            title: 'Current Session Cleared',
            description:
              'All messages in the current session have been removed.',
          });
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to clear current chat session.',
            variant: 'destructive',
          });
        }
      }
    }
  }, [sessionIdState, resetChat, toast]);

  const handleClearAllSessions = useCallback(async () => {
    if (
      window.confirm(
        'Are you sure you want to clear all chat sessions? This cannot be undone.',
      )
    ) {
      try {
        await clearAllChatSessions(); // Use the imported function from indexeddb-service
        resetChat(); // Reset the chat interface
        toast({
          title: 'All Sessions Cleared',
          description: 'All chat history has been permanently removed.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to clear all chat sessions.',
          variant: 'destructive',
        });
      }
    }
  }, [resetChat, toast]);

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
          DEFAULT_RETRY_LIMIT, // Pass the effective retry limit
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
  const handleSubmit = useCallback(
    async (overrideInput?: string, modeOverride?: ChatState['mode']) => {
      const messageContent = overrideInput ?? input.trim();
      if (!messageContent && !editingMessage) return;

      const userMessage: Message = {
        id: editingMessage?.id || crypto.randomUUID(),
        role: 'user',
        content: DOMPurify.sanitize(messageContent),
        timestamp: Date.now(),
        status: 'sent',
      };

      // If editing, update the existing message; otherwise, add as new
      if (editingMessage) {
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: { id: userMessage.id, updates: userMessage },
        });
        dispatch({ type: 'SET_EDITING_MESSAGE', payload: null }); // Clear editing state
      } else {
        dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
      }

      dispatch({ type: 'SET_INPUT', payload: '' }); // Clear input after sending
      dispatch({ type: 'SET_LOADING', payload: true });

      // Create a placeholder for the AI's response
      const aiRespondingMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '...', // Initial content, will be updated by streaming
        timestamp: Date.now(),
        status: 'receiving', // Indicate that content is being received
      };
      dispatch({ type: 'ADD_MESSAGE', payload: aiRespondingMessage });

      try {
        await fetchAndProcessChatApi(
          userMessage,
          aiRespondingMessage,
          DEFAULT_RETRY_LIMIT, // Use DEFAULT_RETRY_LIMIT from constants
          dispatch,
          scrollToBottom,
          modeOverride || mode,
          [...messages, userMessage], // Pass current messages + new user message
        );
      } catch (error: Error | unknown) {
        console.error('Error during API call:', error);
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: {
            id: aiRespondingMessage.id,
            updates: {
              status: 'error',
              error:
                error instanceof Error
                  ? error.message
                  : 'An unknown error occurred.',
            },
          },
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [input, editingMessage, dispatch, scrollToBottom, mode, messages],
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

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
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
    <div className="flex h-screen bg-background">
      {/* Left Sidebar */}
      <div
        className={cn(
          'bg-background border-r border-border flex flex-col transition-all duration-300 ease-in-out',
          isSidebarOpen ? 'w-72' : 'w-20',
        )}
      >
        <div
          className={cn(
            'flex items-center p-4 border-b border-border',
            isSidebarOpen ? JUSTIFY_BETWEEN : JUSTIFY_CENTER,
          )}
        >
          {isSidebarOpen && (
            <h1 className="text-2xl font-bold text-foreground">WesAI</h1>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            title={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" />
            )}
          </Button>
        </div>
        <div className="flex-grow p-2 space-y-2">
          <Button
            variant="outline"
            className={cn(
              'w-full flex items-center gap-2',
              !isSidebarOpen && JUSTIFY_CENTER,
            )}
            onClick={resetChat}
          >
            <MessageSquare className="h-5 w-5" />
            {isSidebarOpen && 'New Chat'}
          </Button>
          <nav className="mt-4">
            {isSidebarOpen && (
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
                Recent Chats
              </h2>
            )}
            <div className="space-y-1">
              {chatSessions.length > 0
                ? chatSessions.map((sessionId) => (
                    <Button
                      key={sessionId}
                      variant={
                        chatSessionIdRef.current === sessionId
                          ? 'secondary'
                          : 'ghost'
                      }
                      className={cn(
                        'w-full justify-start truncate',
                        !isSidebarOpen && JUSTIFY_CENTER,
                      )}
                      onClick={() => handleSessionClick(sessionId)}
                      title={sessionId}
                    >
                      <MessageSquare className={MESSAGE_SQUARE_ICON_CLASSES} />
                      {isSidebarOpen && sessionId.substring(0, 20)}
                      {isSidebarOpen && sessionId.length > 20 && '...'}
                    </Button>
                  ))
                : isSidebarOpen && (
                    <p className="text-sm text-muted-foreground px-2">
                      No past chats.
                    </p>
                  )}
            </div>
          </nav>
        </div>
        <div className="p-2 border-t border-border">
          {isSidebarOpen && (
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleClearCurrentSession}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Current Session
              </Button>
              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={handleClearAllSessions}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Sessions
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-grow items-center">
        {' '}
        {/* Added items-center to center content */}
        <div className="flex flex-col w-full max-w-4xl h-full">
          {' '}
          {/* New wrapper for max-width and centering */}
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-background">
            <div>
              <h2 className="text-xl font-semibold text-foreground">AI Chat</h2>
              <p className="text-sm text-muted-foreground">
                Session ID:{' '}
                {sessionIdState
                  ? sessionIdState.substring(0, 8) + '...'
                  : 'Loading...'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 rounded-md bg-secondary text-secondary-foreground p-1">
                <Button
                  variant={mode === 'default' ? 'primary' : 'ghost'}
                  size="sm"
                  className="rounded-sm"
                  onClick={() =>
                    dispatch({ type: 'SET_MODE', payload: 'default' })
                  }
                >
                  Default
                </Button>
                <Button
                  variant={mode === 'content' ? 'primary' : 'ghost'}
                  size="sm"
                  className="rounded-sm"
                  onClick={() =>
                    dispatch({ type: 'SET_MODE', payload: 'content' })
                  }
                >
                  Content
                </Button>
              </div>
            </div>
          </div>
          {/* Message Display Area */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
            role="list"
          >
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
        </div>{' '}
        {/* Closing the new wrapper div */}
      </div>
    </div>
  );
}

const floatingButtonClasses =
  'fixed bottom-4 right-4 z-50 rounded-full shadow-lg transition-all duration-300 ease-in-out';
export function FloatingChatButton({
  toggleChatAction,
  isChatOpen,
}: {
  toggleChatAction: () => void;
  isChatOpen: boolean;
}) {
  return (
    <Button
      onClick={toggleChatAction}
      className={cn(
        floatingButtonClasses,
        isChatOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100',
      )}
      title="Open Chat"
      size="lg"
    >
      <MessageSquare className="h-6 w-6" />
    </Button>
  );
}
