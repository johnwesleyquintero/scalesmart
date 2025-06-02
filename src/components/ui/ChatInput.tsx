import React from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  disabled: boolean;
}

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
}: ChatInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center p-4 border-t border-border bg-background"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          disabled ? 'Waiting for response...' : 'Type your message...'
        }
        disabled={disabled}
        className={cn(
          'flex-1 p-2 border rounded-lg text-foreground bg-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          disabled && 'opacity-70 cursor-not-allowed',
        )}
      />
      <Button
        type="submit"
        size="sm"
        className="ml-2 px-4 py-2"
        disabled={disabled || !value.trim()}
      >
        {disabled ? (
          <Spinner className="w-4 h-4 text-primary-foreground" />
        ) : (
          'Send'
        )}
      </Button>
    </form>
  );
}
