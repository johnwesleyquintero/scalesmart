// In c:\Users\johnw\portfolio\src\app\hooks\use-toast.tsx (or .ts)

export interface ToasterToast {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive';
}

// ... other necessary imports and type definitions like ToasterToast ...

let toasts: ToasterToast[] = [];
const listeners: Array<(toasts: ToasterToast[]) => void> = [];

function emitChange() {
  for (const listener of listeners) {
    listener(toasts);
  }
}

export const toastInternalState = {
  // Make sure this export exists
  getToasts: () => toasts,
  subscribe: (listener: (toasts: ToasterToast[]) => void) => {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  },
};

export function useToast() {
  // ... your toast and dismiss functions that modify `toasts` and call `emitChange()`
  return {
    toast: (/*...args...*/) => {
      // ... logic to add a toast ...
      // toasts = [...];
      emitChange();
    },
    dismiss: (/*...args...*/) => {
      // ... logic to dismiss a toast ...
      // toasts = [...];
      emitChange();
    },
  };
}

// Potentially your ToasterToast type definition if not elsewhere
// export interface ToasterToast { ... }
