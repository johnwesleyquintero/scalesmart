import { useToast as useToastUI } from '@/app/hooks/use-toast';

export function useToast() {
  const { toast: toastUI, dismiss } = useToastUI();
  return {
    toast: ({ title, description }: { title: string; description?: string }) => {
      toastUI({
        title,
        description,
      });
    },
    dismiss,
  };
}
