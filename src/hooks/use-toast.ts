import {
  useToast as useToastUI,
  ToasterToast,
} from '@/app/hooks/use-toast.tsx';

export function useToast() {
  const { toast: toastUI } = useToastUI();
  return {
    toast: ({
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
  };
}
