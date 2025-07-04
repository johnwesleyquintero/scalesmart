import { useEffect } from 'react';

export const useKeyboardNavigation = (
  handleNextModule: () => void,
  handlePreviousModule: () => void,
) => {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (event.altKey) {
        switch (event.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            handleNextModule();
            event.preventDefault();
            break;
          case 'ArrowLeft':
          case 'ArrowUp':
            handlePreviousModule();
            event.preventDefault();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleNextModule, handlePreviousModule]);
};
