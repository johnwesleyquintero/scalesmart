import { useToast as useToastUI } from '@/app/hooks/use-toast';

export function useToast() {
  const { toast: toastUI, dismiss } = useToastUI();
  return {
    toast: ({ title, description, variant }: { title: string; description?: string; variant?: 'default' | 'destructive' | null | undefined }) => {
      toastUI({
        title,
        description,
        variant,
      });
    },
    dismiss,
  };
}
