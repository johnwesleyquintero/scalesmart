import { useReducer, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';

import { chatReducer, initialState, ChatState } from '@/lib/chat-reducer';
import { Message, mapDbRecordToMessage } from '@/lib/chat-message-utils';
import { fetchAndProcessChatApi } from '@/lib/chat-api-helpers';
import { useChatHistory } from '@/hooks/use-chat-history';
import {
  getChatMessagesBySession,
  clearAllChatSessions,
} from '@/lib/indexeddb-service';
import {
  getAllChatSessionIds,
  clearChatSession,
} from '@/lib/indexeddb/chat-db';
import { DEFAULT_RETRY_LIMIT } from '@/lib/chat-constants';
import suggestedPrompts from '@/app/chat/data/suggested-prompts.json';

const greetings = [
  "Hey there! I'm WesAI, your personal AI assistant for driving Amazon e-commerce success.",
  'Hello! WesAI here, ready to assist you with Amazon strategy, data analysis, and technical solutions.',
  "Hi! I'm WesAI, your expert partner for optimizing Amazon performance and building custom e-commerce tools.",
  "Greetings! WesAI at your service. Let's tackle your e-commerce challenges and unlock new growth opportunities.",
];

const getRandomGreeting = () => {
  const randomIndex = Math.floor(Math.random() * greetings.length);
  const greeting = greetings[randomIndex];
  const prompts = suggestedPrompts
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)
    .map((p) => `\n- "${p}"`)
    .join('');
  return `${greeting}\n\nHere are some things you can ask me:${prompts}`;
};

const initialGreeting: Message = {
  id: crypto.randomUUID(),
  role: 'assistant',
  content: getRandomGreeting(),
  timestamp: Date.now(),
  status: 'sent',
  isGreeting: true,
};

export const useChat = () => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { messages, input, isLoading, editingMessage, mode, isSidebarOpen } =
    state;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [displayedPrompts, setDisplayedPrompts] = useState<string[]>([]);
  const [chatSessions, setChatSessions] = useState<string[]>([]);
  const searchParams = useSearchParams();
  const [sessionIdState, setSessionIdState] = useState<string | null>(null);
  const chatSessionIdRef = useRef<string | null>(null);
  const [showClearCurrentSessionModal, setShowClearCurrentSessionModal] =
    useState(false);
  const [showClearAllSessionsModal, setShowClearAllSessionsModal] =
    useState(false);

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
    console.log('Messages saved to IndexedDB.');
  }, []);

  const {
    saveMessages,
    loadMessages,
    clearSessionHistory: clearHookSessionHistory,
    getAllSessions,
  } = useChatHistory({
    sessionId: sessionIdState || '',
    messages: messages,
    onLoad: handleMessagesLoaded,
    onSaveComplete: handleSaveComplete,
  });

  const fetchAllChatSessions = useCallback(async () => {
    try {
      const sessions = await getAllChatSessionIds();
      setChatSessions(sessions);
    } catch (error) {
      console.error('Failed to fetch all chat sessions:', error);
      toast.error('Failed to load chat sessions.');
    }
  }, []);

  useEffect(() => {
    const shuffledPrompts = suggestedPrompts.sort(() => 0.5 - Math.random());
    setDisplayedPrompts(shuffledPrompts.slice(0, 4));
    if (sessionIdState) {
      fetchAllChatSessions();
    }
  }, [fetchAllChatSessions, isSidebarOpen, sessionIdState]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
    if (!editingMessage) {
      textareaRef.current?.focus();
    }
  }, [messages, scrollToBottom, editingMessage]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const sendMessage = useCallback(
    async (
      messageContent: string,
      isRetry: boolean = false,
      originalUserMessageId?: string,
    ) => {
      if (!messageContent.trim()) return;

      dispatch({ type: 'SET_INPUT', payload: '' });

      const sanitizedContent = DOMPurify.sanitize(messageContent);

      const userMessage: Message = {
        id: editingMessage?.id || crypto.randomUUID(),
        role: 'user',
        content: sanitizedContent,
        timestamp: Date.now(),
        status: 'sent',
      };

      if (editingMessage) {
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: {
            id: userMessage.id,
            updates: {
              content: userMessage.content,
              isEdited: true,
              editedAt: Date.now(),
            },
          },
        });
        dispatch({ type: 'SET_EDITING_MESSAGE', payload: null });
      } else if (!isRetry) {
        dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
      }

      dispatch({ type: 'SET_LOADING', payload: true });

      const assistantPlaceholder: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '...',
        timestamp: Date.now(),
        status: 'pending',
        metadata: {
          originalUserMessageId: originalUserMessageId || userMessage.id,
        },
      };
      dispatch({ type: 'ADD_MESSAGE', payload: assistantPlaceholder });

      try {
        await fetchAndProcessChatApi(
          userMessage,
          assistantPlaceholder,
          DEFAULT_RETRY_LIMIT,
          dispatch,
          scrollToBottom,
          mode,
          [...messages, userMessage], // Pass current messages + new user message
        );
      } catch (error: Error | unknown) {
        console.error('API call failed:', error);
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: {
            id: assistantPlaceholder.id,
            updates: {
              status: 'failed',
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to get a response. Please try again.',
            },
          },
        });
        toast.error('Message failed', {
          description:
            'Failed to get a response from the AI. Please try again.',
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [dispatch, scrollToBottom, mode, messages, editingMessage],
  );

  const handleRetry = useCallback(
    (content: string, messageToRetry: Message) => {
      const updatedMessage: Message = {
        ...messageToRetry,
        retryCount: (messageToRetry.retryCount || 0) + 1,
        status: 'retrying',
        error: undefined,
      };

      dispatch({
        type: 'UPDATE_MESSAGE',
        payload: { id: updatedMessage.id, updates: updatedMessage },
      });

      const currentRetryLimit = Number(
        messageToRetry.retryLimit || DEFAULT_RETRY_LIMIT,
      );
      if ((updatedMessage.retryCount ?? 0) > currentRetryLimit) {
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: {
            id: updatedMessage.id,
            updates: {
              status: 'failed',
              error: `Retry limit (${currentRetryLimit}) exceeded.`,
            },
          },
        });
        toast.error('Retry limit exceeded');
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      const originalUserMessage = messages.find(
        (msg) => msg.id === messageToRetry.metadata?.originalUserMessageId,
      );

      if (originalUserMessage) {
        sendMessage(originalUserMessage.content, true, originalUserMessage.id);
      } else {
        sendMessage(content, true, messageToRetry.id);
      }
    },
    [sendMessage, messages, dispatch],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      // Changed from timestamp to id for consistency
      dispatch({ type: 'REMOVE_MESSAGE', payload: id });
    },
    [dispatch],
  );

  const handleEdit = useCallback(
    (message: Message) => {
      dispatch({ type: 'SET_EDITING_MESSAGE', payload: message });
      dispatch({ type: 'SET_INPUT', payload: message.content });
      textareaRef.current?.focus();
    },
    [dispatch],
  );

  const submitEdit = useCallback(() => {
    if (editingMessage && input.trim()) {
      sendMessage(input.trim()); // Use the consolidated sendMessage
    }
  }, [editingMessage, input, sendMessage]);

  const cancelEdit = useCallback(() => {
    dispatch({ type: 'SET_EDITING_MESSAGE', payload: null });
    dispatch({ type: 'SET_INPUT', payload: '' });
  }, [dispatch]);

  const resetChat = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' });
    const newSessionId = crypto.randomUUID();
    setSessionIdState(newSessionId);
    chatSessionIdRef.current = newSessionId;
    dispatch({ type: 'SET_EDITING_MESSAGE', payload: null });
    dispatch({ type: 'SET_INPUT', payload: '' });
    clearHookSessionHistory();
    window.history.pushState({}, '', '/chat');
    fetchAllChatSessions();
  }, [dispatch, clearHookSessionHistory, fetchAllChatSessions]);

  const handleSessionClick = useCallback(
    async (sessionId: string) => {
      setSessionIdState(sessionId);
      chatSessionIdRef.current = sessionId;
      dispatch({ type: 'CLEAR_MESSAGES' });
      dispatch({ type: 'SET_INPUT', payload: '' });
      dispatch({ type: 'SET_EDITING_MESSAGE', payload: null });

      const dbMessages = await getChatMessagesBySession(sessionId);
      if (dbMessages.length > 0) {
        const mappedMessages = dbMessages.map(mapDbRecordToMessage);
        dispatch({ type: 'SET_MESSAGES', payload: mappedMessages });
      } else {
        dispatch({ type: 'ADD_MESSAGE', payload: initialGreeting });
      }
      window.history.pushState({}, '', `/chat?session=${sessionId}`);
      toast.success('Session Loaded');
      fetchAllChatSessions();
    },
    [dispatch, fetchAllChatSessions],
  );

  const handleClearCurrentSession = useCallback(() => {
    setShowClearCurrentSessionModal(true);
  }, []);

  const confirmClearCurrentSession = useCallback(async () => {
    if (sessionIdState) {
      try {
        await clearChatSession(sessionIdState);
        resetChat();
        toast.success('Current Session Cleared');
      } catch (error) {
        toast.error('Failed to clear current chat session.');
      } finally {
        setShowClearCurrentSessionModal(false);
      }
    }
  }, [sessionIdState, resetChat]);

  const handleClearAllSessions = useCallback(() => {
    setShowClearAllSessionsModal(true);
  }, []);

  const confirmClearAllSessions = useCallback(async () => {
    try {
      await clearAllChatSessions();
      resetChat();
      toast.success('All Sessions Cleared');
    } catch (error) {
      toast.error('Failed to clear all chat sessions.');
    } finally {
      setShowClearAllSessionsModal(false);
    }
  }, [resetChat]);

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, [dispatch]);

  const handlePromptClick = useCallback(
    (promptText: string) => {
      dispatch({ type: 'SET_INPUT', payload: promptText });
      textareaRef.current?.focus();
    },
    [dispatch],
  );

  return {
    state,
    dispatch,
    messages,
    input,
    isLoading,
    editingMessage,
    mode,
    isSidebarOpen,
    messagesEndRef,
    textareaRef,
    displayedPrompts,
    chatSessions,
    sessionId: sessionIdState,
    chatSessionIdRef,
    sendMessage,
    handleRetry,
    handleDelete,
    handleEdit,
    submitEdit,
    cancelEdit,
    resetChat,
    handleSessionClick,
    handleClearCurrentSession,
    confirmClearCurrentSession,
    showClearCurrentSessionModal,
    setShowClearCurrentSessionModal,
    handleClearAllSessions,
    confirmClearAllSessions,
    showClearAllSessionsModal,
    setShowClearAllSessionsModal,
    toggleSidebar,
    handlePromptClick,
    setInput: (payload: string) => dispatch({ type: 'SET_INPUT', payload }),
  };
};
