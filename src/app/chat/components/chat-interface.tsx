'use client';
import React from 'react';
import MessageBubble from './MessageBubble';
import MessageContent from './MessageContent';
import ChatInput from './ChatInput';
import { useChat } from '@/hooks/use-chat';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import { Message } from '@/lib/chat-message-utils';

// --- Main Chat Component ---
export default function ChatInterface() {
  const {
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
    sessionId,
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
    handleClearAllSessions,
    toggleSidebar,
    handlePromptClick,
    setInput,
  } = useChat();

  const MESSAGE_SQUARE_ICON_CLASSES = 'h-4 w-4 mr-2';
  const JUSTIFY_BETWEEN = 'justify-between';
  const JUSTIFY_CENTER = 'justify-center';

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
      <div className="flex flex-col flex-grow">
        <div className="flex flex-col w-full h-full">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-background">
            <div>
              <h2 className="text-xl font-semibold text-foreground">AI Chat</h2>
              <p className="text-sm text-muted-foreground">
                Session ID:{' '}
                {sessionId ? sessionId.substring(0, 8) + '...' : 'Loading...'}
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
            <div className="max-w-4xl mx-auto w-full">
              {messages.map((message, index) => (
                <MessageBubble
                  key={message.id || index}
                  message={message}
                  onRetry={handleRetry}
                  onDelete={handleDelete}
                  onPromptClick={handlePromptClick}
                  onEdit={handleEdit}
                >
                  <MessageContent content={message.content} />
                </MessageBubble>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Chat Input Area */}
          <div className="max-w-4xl mx-auto w-full">
            <ChatInput
              input={input}
              setInput={setInput}
              sendMessage={() => sendMessage(input)}
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
