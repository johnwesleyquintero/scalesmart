import { useEffect, useCallback, useRef } from 'react';
import {
  initializeDB,
  setItem,
  getChatMessagesBySession,
  getAllChatSessionIds,
  clearChatMessagesBySession,
  ChatMessageRecord,
} from '@/lib/indexeddb-service';
import {
  Message,
  mapMessageRoleToSender,
  mapDbRecordToMessage,
} from '@/lib/chat-message-utils';
import { useToast } from '@/components/ui/use-toast';

interface UseChatHistoryProps {
  sessionId: string;
  messages: Message[];
  onLoad: (messages: Message[]) => void;
  onSaveComplete?: () => void;
}

export const useChatHistory = ({
  sessionId,
  messages,
  onLoad,
  onSaveComplete,
}: UseChatHistoryProps) => {
  const { toast } = useToast();
  const isInitialized = useRef(false);

  // Load messages from IndexedDB when the component mounts or session ID changes
  useEffect(() => {
    const loadMessages = async () => {
      if (isInitialized.current) return; // Prevent double loading on strict mode
      isInitialized.current = true;

      console.log(
        `useChatHistory: Attempting to load messages for session ${sessionId}.`,
      );
      try {
        await initializeDB();
        console.log('useChatHistory: initializeDB completed.');

        const dbMessages = await getChatMessagesBySession(sessionId);
        if (dbMessages.length > 0) {
          const mappedMessages = dbMessages.map(mapDbRecordToMessage);
          onLoad(mappedMessages);
          console.log(
            `useChatHistory: ${dbMessages.length} messages loaded from IndexedDB for session ${sessionId}.`,
          );
        } else {
          onLoad([]); // No messages found, pass empty array
          console.log(
            `useChatHistory: No messages found for session ${sessionId}.`,
          );
        }
      } catch (error) {
        console.error('useChatHistory: Error in loadMessages:', error);
        toast({
          title: 'Error loading chat history',
          description: 'Could not load messages from local storage.',
          variant: 'destructive',
        });
      }
    };

    loadMessages();
  }, [sessionId, onLoad, toast]);

  // Save messages to IndexedDB when they change
  useEffect(() => {
    const saveMessages = async () => {
      const handler = setTimeout(async () => {
        if (typeof window !== 'undefined') {
          console.log(
            `useChatHistory: Attempting to save ${messages.length} messages to IndexedDB for session ${sessionId}.`,
          );
          try {
            // Clear existing messages for the session before saving new ones
            // In a real app with many messages, a more granular approach might be needed.
            // For now, we overwrite the session's history.
            // await clearChatMessagesBySession(sessionId); // This function would need to be added to indexeddb-service.ts

            for (const message of messages) {
              const record: ChatMessageRecord = {
                id: message.id!,
                chatSessionId: sessionId,
                sender: mapMessageRoleToSender(message.role),
                text: message.content,
                timestamp: message.timestamp,
              };
              await setItem('chatMessages', record);
            }
            console.log(
              `useChatHistory: ${messages.length} messages saved to IndexedDB for session ${sessionId}.`,
            );
            onSaveComplete?.();
          } catch (error) {
            console.error('useChatHistory: Error saving messages:', error);
            toast({
              title: 'Error saving chat history',
              description: 'Could not save messages to local storage.',
              variant: 'destructive',
            });
          }
        }
      }, 500); // Debounce for 500ms

      return () => clearTimeout(handler);
    };

    if (messages.length > 0) {
      saveMessages();
    }
  }, [messages, sessionId, toast, onSaveComplete]);

  // Function to clear messages from IndexedDB for a session
  const clearSessionHistory = useCallback(async () => {
    try {
      await initializeDB();
      await clearChatMessagesBySession(sessionId);
      console.log(`useChatHistory: Cleared history for session ${sessionId}.`);
    } catch (error) {
      console.error('useChatHistory: Error clearing session history:', error);
      toast({
        title: 'Error clearing chat history',
        description: 'Could not clear messages from local storage.',
        variant: 'destructive',
      });
    }
  }, [sessionId, toast]);

  const getAllSessions = useCallback(async () => {
    try {
      await initializeDB();
      const sessionIds = await getAllChatSessionIds();
      // For each session ID, you might want to fetch the first message or a summary
      // For now, just return the IDs
      return sessionIds;
    } catch (error) {
      console.error('useChatHistory: Error getting all sessions:', error);
      toast({
        title: 'Error loading all chat sessions',
        description: 'Could not retrieve all chat sessions from local storage.',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  return { clearSessionHistory, getAllSessions };
};
