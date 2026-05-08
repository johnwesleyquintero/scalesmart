import {
  useKeyboardShortcuts,
  PROMPT_GENERATOR_SHORTCUTS,
} from '@/hooks/use-keyboard-shortcuts';
import { useToast } from '@/hooks/use-toast';
import { PromptData } from '@/lib/prompt-generator/types';

interface UseGeneratorShortcutsProps {
  loading: boolean;
  output: string;
  canUndo: boolean;
  canRedo: boolean;
  promptData: PromptData;
  handleGeneratePrompt: () => void;
  clearForm: () => void;
  handleCopyOutput: () => void;
  handleSaveDialogOpen: () => void;
  undo: () => void;
  redo: () => void;
  updatePromptData: (data: Partial<PromptData>) => void;
}

export function useGeneratorShortcuts({
  loading,
  output,
  canUndo,
  canRedo,
  promptData,
  handleGeneratePrompt,
  clearForm,
  handleCopyOutput,
  handleSaveDialogOpen,
  undo,
  redo,
  updatePromptData,
}: UseGeneratorShortcutsProps) {
  const { toast } = useToast();

  useKeyboardShortcuts({
    shortcuts: [
      {
        ...PROMPT_GENERATOR_SHORTCUTS.GENERATE,
        handler: () => {
          if (!loading) {
            handleGeneratePrompt();
            toast({
              title: 'Generating prompt...',
              description: 'Creating your structured request',
            });
          }
        },
      },
      {
        ...PROMPT_GENERATOR_SHORTCUTS.CLEAR,
        handler: () => {
          clearForm();
          toast({
            title: 'Form Cleared',
            description: 'All fields have been reset',
          });
        },
      },
      {
        ...PROMPT_GENERATOR_SHORTCUTS.COPY,
        handler: () => {
          if (output) {
            handleCopyOutput();
            toast({
              title: 'Copied!',
              description: 'Prompt copied to clipboard',
            });
          }
        },
      },
      {
        ...PROMPT_GENERATOR_SHORTCUTS.SAVE,
        handler: () => {
          if (output) {
            handleSaveDialogOpen();
          }
        },
      },
      {
        ...PROMPT_GENERATOR_SHORTCUTS.UNDO,
        handler: () => {
          if (canUndo) {
            undo();
            toast({
              title: 'Undone',
              description: 'Previous state restored',
            });
          }
        },
      },
      {
        ...PROMPT_GENERATOR_SHORTCUTS.REDO,
        handler: () => {
          if (canRedo) {
            redo();
            toast({
              title: 'Redone',
              description: 'Next state restored',
            });
          }
        },
      },
      {
        ...PROMPT_GENERATOR_SHORTCUTS.TEMPLATES,
        handler: () => {
          const templatesSection = document.querySelector(
            '[data-templates-section]',
          );
          if (templatesSection) {
            templatesSection.scrollIntoView({ behavior: 'smooth' });
          }
          toast({
            title: 'Templates',
            description: 'Opening templates section',
          });
        },
      },
      {
        ...PROMPT_GENERATOR_SHORTCUTS.DUPLICATE,
        handler: () => {
          if (promptData.request) {
            const duplicatedData = {
              ...promptData,
              request: promptData.request + ' (Copy)',
            };
            updatePromptData(duplicatedData);
            toast({
              title: 'Duplicated',
              description: 'Current request duplicated',
            });
          }
        },
      },
    ],
  });
}
