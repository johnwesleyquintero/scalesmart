import { useEffect } from 'react';
import { Module } from '@/types';
import { Course } from '@/types';

export const useKeyboardNavigation = (
  activeModule: Module | null,
  activeCourse: Course | null,
  handleNextModule: () => void,
  handlePreviousModule: () => void,
) => {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!activeModule || !activeCourse) return;

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
  }, [activeModule, activeCourse, handleNextModule, handlePreviousModule]);
};
