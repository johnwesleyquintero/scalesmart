import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: (event: KeyboardEvent) => void;
  description?: string;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsOptions) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      shortcuts.forEach((shortcut) => {
        const { key, ctrl, shift, alt, meta, handler } = shortcut;

        // Check if all required modifier keys are pressed
        const ctrlMatch = ctrl === undefined || event.ctrlKey === ctrl;
        const shiftMatch = shift === undefined || event.shiftKey === shift;
        const altMatch = alt === undefined || event.altKey === alt;
        const metaMatch = meta === undefined || event.metaKey === meta;

        // Check if the main key matches (case-insensitive)
        const keyMatch = event.key.toLowerCase() === key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && metaMatch && keyMatch) {
          event.preventDefault();
          handler(event);
        }
      });
    },
    [shortcuts, enabled],
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
};

// Common keyboard shortcuts for the prompt generator
export const PROMPT_GENERATOR_SHORTCUTS = {
  GENERATE: {
    key: 'Enter',
    ctrl: true,
    description: 'Generate prompt',
  },
  CLEAR: {
    key: 'k',
    ctrl: true,
    description: 'Clear form',
  },
  COPY: {
    key: 'c',
    ctrl: true,
    shift: true,
    description: 'Copy output',
  },
  SAVE: {
    key: 's',
    ctrl: true,
    description: 'Save request',
  },
  FOCUS_REQUEST: {
    key: '1',
    ctrl: true,
    alt: true,
    description: 'Focus request field',
  },
  FOCUS_CONTEXT: {
    key: '2',
    ctrl: true,
    alt: true,
    description: 'Focus context field',
  },
  FOCUS_CODE: {
    key: '3',
    ctrl: true,
    alt: true,
    description: 'Focus code input field',
  },
};
