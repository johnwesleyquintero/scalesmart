'use client';

import type { ToasterToast, State } from '@/app/hooks/use-toast'; // Import the State type, aliasing as ToastState
import React, { useEffect, useState } from 'react';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'; // These components come from your local ui/toast.tsx
import { toastInternalState } from '@/app/hooks/use-toast';

export function Toaster() {
  const [currentToasts, setCurrentToasts] = useState<ToasterToast[]>([]);

  useEffect(() => {
    setCurrentToasts(toastInternalState.getToasts());
    const unsubscribe = toastInternalState.subscribe((state: State) => {
      setCurrentToasts(state.toasts);
    });
    return () => unsubscribe();
  }, []);

  return (
    <ToastProvider>
      {currentToasts?.map(function ({
        id,
        title,
        description,
        action,
        ...props
      }: ToasterToast) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
