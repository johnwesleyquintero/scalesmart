import { useToast as useToastUI } from '@/app/hooks/use-toast';

export function useToast() {
  const { toast: toastUI, dismiss } = useToastUI();
  return {
    toast: (p0: string, p1: string, { title, description }: { title: string; description?: string; }) => {
      toastUI({
        title,
        description,
      });
    },
    dismiss,
  };
}
