import {
  useToast as useToastUI,
  ToasterToast,
} from '@/app/hooks/use-toast.tsx';
import { useCallback } from 'react';

export function useToast() {
  const { toast: toastUI } = useToastUI();
  return {
    toast: useCallback(
      ({
        title,
        description,
        variant,
        duration,
        action,
      }: Omit<ToasterToast, 'id'>) => {
        toastUI({
          title,
          description,
          variant,
          duration,
          action,
        });
      },
      [toastUI],
    ),
  };
}
