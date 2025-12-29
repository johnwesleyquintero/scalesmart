import { useCallback, useMemo, useRef, useReducer, useEffect } from 'react';
import { toast } from 'sonner';
import {
  promptGeneratorReducer,
  initialState,
  PromptGeneratorAction,
} from '@/lib/prompt-generator/state';
import { CUSTOM_CATEGORY_VALUE } from '@/lib/prompt-generator/constants';
import {
  CategoryValue,
  PromptData,
  SavedRequest,
} from '@/lib/prompt-generator/types';
import {
  generatePrompt,
  preparePromptData,
} from '@/lib/prompt-generator/utils';
import { useUndoRedo } from './use-undo-redo';
import { validatePromptData } from '@/lib/prompt-generator/validation';
import { clearAutoSavedState } from '@/lib/prompt-generator/storage';
import { useClipboard } from './use-clipboard';
import { usePromptStorage } from './use-prompt-storage';

/**
 * Helper to execute prompt generation with loading and error handling
 */
async function executePromptGeneration(
  promptData: PromptData,
  dispatch: React.Dispatch<PromptGeneratorAction>,
  generatorFunction: (data: PromptData) => string,
) {
  dispatch({ type: 'SET_LOADING', payload: true });
  dispatch({ type: 'SET_OUTPUT', payload: '' });

  const errors = validatePromptData(promptData);
  dispatch({ type: 'SET_VALIDATION_ERRORS', payload: errors });

  if (Object.keys(errors).length > 0) {
    dispatch({ type: 'SET_LOADING', payload: false });
    toast.warning('Please fix the errors in the form.');
    return;
  }

  try {
    const preparedData = preparePromptData(promptData);
    const generated = generatorFunction(preparedData);

    if (generated) {
      dispatch({ type: 'SET_OUTPUT', payload: generated });
      toast.success('Prompt generated successfully!');
    } else {
      dispatch({ type: 'SET_OUTPUT', payload: '' });
      toast.warning('The generator did not return a prompt.');
    }
  } catch (error) {
    console.error('Error generating prompt:', error);
    toast.error('An unexpected error occurred while generating the prompt.');
    dispatch({ type: 'SET_OUTPUT', payload: '' });
  } finally {
    dispatch({ type: 'SET_LOADING', payload: false });
  }
}

export const usePromptGenerator = () => {
  const [state, dispatch] = useReducer(promptGeneratorReducer, initialState);
  const {
    promptData,
    output,
    loading,
    showSaveDialog,
    newRequestName,
    selectedSavedRequestId,
    validationErrors,
    savedRequests,
    requestPendingDeletion,
  } = state;

  const isInitialMount = useRef(true);
  useEffect(() => {
    isInitialMount.current = false;
  }, []);

  // 1. Clipboard Hook
  const { isCopied, copy: copyToClipboard } = useClipboard({
    successMessage: 'Prompt copied to clipboard!',
  });

  // 2. Undo/Redo Hook
  const {
    canUndo,
    canRedo,
    undo,
    redo,
    update: updateUndoRedoState,
  } = useUndoRedo(promptData, {
    maxHistory: 20,
    onUndo: (state) => dispatch({ type: 'SET_PROMPT_DATA', payload: state }),
    onRedo: (state) => dispatch({ type: 'SET_PROMPT_DATA', payload: state }),
  });

  // 3. Storage Hook
  usePromptStorage({
    promptData,
    savedRequests,
    selectedSavedRequestId,
    isInitialMount: isInitialMount.current,
    onLoadRequests: (requests) =>
      dispatch({ type: 'SET_SAVED_REQUESTS', payload: requests }),
    onLoadAutoSavedState: (savedState) =>
      dispatch({ type: 'SET_PROMPT_DATA', payload: savedState }),
  });

  // Input Refs
  const requestInputRef = useRef<HTMLTextAreaElement>(null);
  const contextInputRef = useRef<HTMLTextAreaElement>(null);
  const codeInputRef = useRef<HTMLTextAreaElement>(null);

  // Handlers
  const clearForm = useCallback(() => {
    dispatch({ type: 'CLEAR_FORM' });
    clearAutoSavedState();
  }, []);

  const handleFieldChange = useCallback(
    (field: keyof PromptData, value: string) => {
      dispatch({ type: 'SET_FIELD', field, value });
    },
    [],
  );

  const handleCategoryChange = useCallback((value: CategoryValue) => {
    dispatch({ type: 'SET_FIELD', field: 'category', value });
    if (value !== CUSTOM_CATEGORY_VALUE) {
      dispatch({ type: 'SET_FIELD', field: 'customCategory', value: '' });
    }
  }, []);

  const updatePromptData = useCallback(
    (data: Partial<PromptData>) => {
      const newState = { ...promptData, ...data };
      updateUndoRedoState(newState);

      Object.entries(data).forEach(([key, value]) => {
        dispatch({
          type: 'SET_FIELD',
          field: key as keyof PromptData,
          value: value as string,
        });
      });
    },
    [promptData, updateUndoRedoState],
  );

  const generatePromptHandler = useCallback(() => {
    executePromptGeneration(promptData, dispatch, generatePrompt);
  }, [promptData]);

  const handleSaveRequest = useCallback(() => {
    if (!promptData.request.trim()) {
      toast.error('Cannot save an empty request.');
      return;
    }
    dispatch({ type: 'SET_NEW_REQUEST_NAME', payload: '' });
    dispatch({ type: 'SET_SHOW_SAVE_DIALOG', payload: true });
  }, [promptData.request]);

  const confirmSaveRequest = useCallback(() => {
    if (!newRequestName.trim()) {
      toast.error('Please enter a name for your request.');
      return;
    }

    const newRequest: SavedRequest = {
      id: Date.now().toString(),
      name: newRequestName.trim(),
      data: promptData,
    };

    const updatedRequests = (savedRequests || []).concat(newRequest);
    dispatch({ type: 'SET_SAVED_REQUESTS', payload: updatedRequests });
    toast.success(`Request "${newRequest.name}" saved!`);
    dispatch({ type: 'SET_SHOW_SAVE_DIALOG', payload: false });
    dispatch({ type: 'SET_NEW_REQUEST_NAME', payload: '' });
  }, [newRequestName, promptData, savedRequests]);

  const handleLoadRequest = useCallback(
    (id: string) => {
      const requestToLoad = savedRequests.find((req) => req.id === id);
      if (requestToLoad) {
        dispatch({ type: 'LOAD_REQUEST', payload: requestToLoad });
        toast.success(`Request "${requestToLoad.name}" loaded!`);
      } else {
        toast.error('Selected request not found.');
      }
    },
    [savedRequests],
  );

  const handleDeleteRequest = useCallback(
    (id: string) => {
      const requestToDelete = savedRequests.find((req) => req.id === id);
      if (requestToDelete) {
        dispatch({
          type: 'SET_REQUEST_PENDING_DELETION',
          payload: requestToDelete,
        });
      }
    },
    [savedRequests],
  );

  const confirmDeleteRequest = useCallback(() => {
    if (requestPendingDeletion) {
      dispatch({ type: 'DELETE_REQUEST', payload: requestPendingDeletion.id });
      toast.success(`Request "${requestPendingDeletion.name}" deleted!`);
    }
  }, [requestPendingDeletion]);

  const handleUpdateRequest = useCallback(
    (id: string, name: string) => {
      const requestToUpdate = savedRequests.find((req) => req.id === id);
      if (requestToUpdate) {
        const updatedRequest: SavedRequest = {
          ...requestToUpdate,
          name: name.trim(),
        };
        dispatch({ type: 'UPDATE_REQUEST', payload: updatedRequest });
        toast.success(`Request renamed to "${name.trim()}"`);
      }
    },
    [savedRequests],
  );

  const cancelDeleteRequest = useCallback(() => {
    dispatch({ type: 'SET_REQUEST_PENDING_DELETION', payload: null });
  }, []);

  const isGenerateDisabled = useMemo(() => {
    const { category, customCategory, request } = promptData;
    return (
      !category ||
      !request.trim() ||
      (category === CUSTOM_CATEGORY_VALUE && !customCategory?.trim())
    );
  }, [promptData]);

  return {
    promptData,
    output,
    loading,
    showSaveDialog,
    newRequestName,
    selectedSavedRequestId,
    validationErrors,
    savedRequests,
    requestPendingDeletion,
    isCopied,
    updatePromptData,
    handleGeneratePrompt: generatePromptHandler,
    handleCopyOutput: () => copyToClipboard(output),
    handleSaveRequest,
    handleDeleteRequest,
    handleUpdateRequest,
    handleLoadRequest,
    handleNewRequestNameChange: (name: string) =>
      dispatch({ type: 'SET_NEW_REQUEST_NAME', payload: name }),
    handleSaveDialogOpen: () =>
      dispatch({ type: 'SET_SHOW_SAVE_DIALOG', payload: true }),
    handleSaveDialogClose: () =>
      dispatch({ type: 'SET_SHOW_SAVE_DIALOG', payload: false }),
    clearForm,
    handleFieldChange,
    handleCategoryChange,
    showCustomCategory: promptData.category === CUSTOM_CATEGORY_VALUE,
    isGenerateDisabled,
    confirmSaveRequest,
    confirmDeleteRequest,
    cancelDeleteRequest,
    setNewRequestName: (name: string) =>
      dispatch({ type: 'SET_NEW_REQUEST_NAME', payload: name }),
    setShowSaveDialog: (show: boolean) =>
      dispatch({ type: 'SET_SHOW_SAVE_DIALOG', payload: show }),
    requestInputRef,
    contextInputRef,
    codeInputRef,
    undo,
    redo,
    canUndo,
    canRedo,
  };
};
