import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Message } from '@/lib/chat-message-utils'; // Assuming Message type is needed
import { Loader2 } from 'lucide-react'; // Import Loader2 icon for spinner

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  sendMessage: (content: string) => void;
  isLoading: boolean;
  editingMessage: Message | null;
  submitEdit: () => void;
  cancelEdit: () => void;
  displayedPrompts: string[];
  handlePromptClick: (promptText: string) => void;
  messagesLength: number; // To check if greeting is displayed
  isGreetingMessage: boolean; // To check if the first message is the greeting
}

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  sendMessage,
  isLoading,
  editingMessage,
  submitEdit,
  cancelEdit,
  displayedPrompts,
  handlePromptClick,
  messagesLength,
  isGreetingMessage,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height to recalculate
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]); // Depend on input to resize as text is typed

  // Focus textarea when editingMessage changes or when not editing and input is cleared
  useEffect(() => {
    if (textareaRef.current) {
      if (editingMessage) {
        textareaRef.current.focus();
      } else if (!isLoading && input === '') {
        // Optional: focus when not loading and input is empty (after sending)
        // textareaRef.current.focus();
      }
    }
  }, [editingMessage, isLoading, input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      if (editingMessage) {
        submitEdit();
      } else {
        sendMessage(input);
      }
    }
  };

  return (
    <div className="border-t border-border p-4 bg-background">
      <div className="relative flex items-center">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? 'Generating response...' : 'Ask WesAI...'}
          className="w-full resize-none overflow-hidden rounded-lg border border-input bg-background p-3 pr-12 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
          rows={1}
          disabled={isLoading}
          aria-label="Chat input"
        />
        {editingMessage ? (
          <div className="absolute right-3 bottom-3 flex space-x-2">
            <Button
              size="sm"
              onClick={cancelEdit}
              variant="outline"
              className="h-8"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={submitEdit}
              disabled={!input.trim() || isLoading}
              className="h-8"
            >
              Save
            </Button>
          </div>
        ) : (
          <Button
            type="submit"
            size="icon"
            className="absolute right-3 bottom-3 h-8 w-8"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
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
                className="lucide lucide-send h-4 w-4"
              >
                <path d="m22 2-7 7m-4 4-7 7L2 12l7-7 7 7 7-7Z" />
              </svg>
            )}
            <span className="sr-only">Send message</span>
          </Button>
        )}
      </div>
      {messagesLength === 1 &&
        isGreetingMessage &&
        displayedPrompts.length > 0 && (
          <div className="mt-2 text-sm text-muted-foreground">
            <p>Try these prompts:</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {displayedPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePromptClick(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}
    </div>
  );
};

export default ChatInput;
