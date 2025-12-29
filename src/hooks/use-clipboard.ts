import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UseClipboardOptions {
  successMessage?: string;
  errorMessage?: string;
  timeout?: number;
}

export function useClipboard(options: UseClipboardOptions = {}) {
  const {
    successMessage = 'Copied to clipboard!',
    errorMessage = 'Failed to copy to clipboard.',
    timeout = 2000,
  } = options;

  const [isCopied, setIsCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      if (!text) return false;

      try {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        toast.success(successMessage);

        setTimeout(() => {
          setIsCopied(false);
        }, timeout);

        return true;
      } catch (err) {
        console.error('Clipboard copy failed:', err);
        toast.error(errorMessage);
        setIsCopied(false);
        return false;
      }
    },
    [successMessage, errorMessage, timeout],
  );

  return { isCopied, copy };
}
