import { useEffect, useCallback, useRef } from 'react';
import { initializeDB, setItem } from '@/lib/indexeddb-service';
import {
  getChatMessagesBySession,
  getAllChatSessionIds,
  clearChatSession,
  ChatMessageRecord, // Import ChatMessageRecord from chat-db.ts
} from '@/lib/indexeddb/chat-db';
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

  const loadMessages = useCallback(async () => {
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
  }, [sessionId, onLoad, toast]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const saveMessages = useCallback(async () => {
    const handler = setTimeout(async () => {
      if (typeof window !== 'undefined') {
        console.log(
          `useChatHistory: Attempting to save ${messages.length} messages to IndexedDB for session ${sessionId}.`,
        );
        try {
          await clearChatSession(sessionId);

          for (const message of messages) {
            const record: ChatMessageRecord = {
              id: message.id!,
              sessionId: message.sessionId || sessionId, // Use message.sessionId if available, otherwise current sessionId
              sender: mapMessageRoleToSender(message.role),
              text: message.content,
              timestamp: message.timestamp,
              metadata: message.metadata,
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
    }, 500);

    return () => clearTimeout(handler);
  }, [messages, sessionId, toast, onSaveComplete]);

  useEffect(() => {
    if (messages.length > 0) {
      saveMessages();
    }
  }, [messages, saveMessages]);

  const clearSessionHistory = useCallback(async () => {
    try {
      await initializeDB();
      await clearChatSession(sessionId);
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

  return { saveMessages, loadMessages, clearSessionHistory, getAllSessions };
};
