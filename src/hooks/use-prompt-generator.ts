import { PromptGeneratorAction } from '@/lib/prompt-generator/state';
import { useCallback, useMemo, useEffect, useReducer, useRef } from 'react';
import { toast } from 'sonner';
import {
  promptGeneratorReducer,
  initialState,
} from '@/lib/prompt-generator/state';
import {
  CUSTOM_CATEGORY_VALUE,
  DEFAULT_PROMPT_TEXTS,
} from '@/lib/prompt-generator/constants';
import {
  CategoryValue,
  PromptData,
  SavedRequest,
} from '@/lib/prompt-generator/types';
import { generatePrompt } from '@/lib/prompt-generator/utils';
import { getCacheItem, setCacheItem } from '@/lib/localstorage-service';

// Auto-save constants
const AUTOSAVE_DEBOUNCE_MS = 1000;
const AUTOSAVE_KEY = 'promptGeneratorFormState';

const REQUIRED_CATEGORY_MESSAGE = "Please select a 'Category'.";
const REQUIRED_REQUEST_MESSAGE = "The 'Request' field is required.";
const REQUIRED_CUSTOM_CATEGORY_MESSAGE =
  "Please enter a value for the 'Custom Category'.";

function validatePromptData(
  data: PromptData,
): Partial<Record<keyof PromptData, string>> {
  const errors: Partial<Record<keyof PromptData, string>> = {};
  const { category, customCategory, request } = data;

  if (!category) {
    errors.category = REQUIRED_CATEGORY_MESSAGE;
  }
  if (!request.trim()) {
    errors.request = REQUIRED_REQUEST_MESSAGE;
  }
  if (category === CUSTOM_CATEGORY_VALUE && !customCategory?.trim()) {
    errors.customCategory = REQUIRED_CUSTOM_CATEGORY_MESSAGE;
  }
  return errors;
}

async function executePromptGeneration(
  promptData: PromptData,
  dispatch: React.Dispatch<PromptGeneratorAction>,
  generatorFunction: (data: PromptData) => Promise<string>,
  successMessage: string,
  errorMessagePrefix: string,
  loadingActionType: 'SET_LOADING' | 'SET_AI_LOADING',
) {
  dispatch({ type: loadingActionType, payload: true });
  dispatch({ type: 'SET_OUTPUT', payload: '' });

  const errors = validatePromptData(promptData);
  dispatch({ type: 'SET_VALIDATION_ERRORS', payload: errors });

  if (Object.keys(errors).length > 0) {
    dispatch({ type: loadingActionType, payload: false });
    toast.warning('Please fix the errors in the form.');
    return;
  }

  try {
    const generated = await generatorFunction(promptData);
    if (generated) {
      dispatch({ type: 'SET_OUTPUT', payload: generated });
      toast.success(successMessage);
    } else {
      dispatch({ type: 'SET_OUTPUT', payload: '' });
      toast.warning(
        'The generator did not return a prompt. Please try again or refine your request.',
      );
    }
  } catch (error) {
    console.error(`Error ${errorMessagePrefix}:`, error);
    const msg =
      error instanceof Error ? error.message : 'An unexpected error occurred.';
    toast.error(`${errorMessagePrefix}: ${msg}`);
    dispatch({ type: 'SET_OUTPUT', payload: '' });
  } finally {
    dispatch({ type: loadingActionType, payload: false });
  }
}

export const usePromptGenerator = () => {
  const [state, dispatch] = useReducer(promptGeneratorReducer, initialState);
  const {
    promptData,
    output,
    copied,
    loading,
    aiLoading,
    showSaveDialog,
    newRequestName,
    selectedSavedRequestId,
    validationErrors,
    savedRequests,
    requestPendingDeletion,
  } = state;

  const isInitialMount = useRef(true);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs for input elements
  const requestInputRef = useRef<HTMLTextAreaElement>(
    null,
  ) as React.RefObject<HTMLTextAreaElement>;
  const contextInputRef = useRef<HTMLTextAreaElement>(
    null,
  ) as React.RefObject<HTMLTextAreaElement>;
  const codeInputRef = useRef<HTMLTextAreaElement>(
    null,
  ) as React.RefObject<HTMLTextAreaElement>;

  // Effect to load requests from IndexedDB on mount
  useEffect(() => {
    const loadRequests = async () => {
      try {
        const loadedData = await getCacheItem<SavedRequest[]>(
          'savedPromptRequests',
        );
        // Validate that the loaded data is an array before setting the state.
        if (Array.isArray(loadedData)) {
          dispatch({ type: 'SET_SAVED_REQUESTS', payload: loadedData });
        } else if (loadedData) {
          // If data exists but is not an array, log an error and ignore it.
          console.error(
            'Loaded saved requests from localStorage is not an array:',
            loadedData,
          );
          toast.warning(
            'Could not load saved requests due to data corruption.',
          );
        }
      } catch (error) {
        console.error('Failed to load saved requests from localStorage', error);
        toast.error('Could not load saved requests.');
      }
    };
    loadRequests();
  }, [dispatch]);

  // Effect to load auto-saved form state on mount
  useEffect(() => {
    const loadAutoSavedState = async () => {
      try {
        const savedState = await getCacheItem<PromptData>(AUTOSAVE_KEY);
        if (savedState && typeof savedState === 'object') {
          // Only load if we don't have a loaded request and form is empty
          if (!selectedSavedRequestId && !promptData.request) {
            dispatch({ type: 'SET_PROMPT_DATA', payload: savedState });
          }
        }
      } catch (error) {
        console.error('Failed to load auto-saved form state', error);
      }
    };

    if (isInitialMount.current) {
      loadAutoSavedState();
    }
  }, [dispatch, selectedSavedRequestId, promptData.request]);

  // Auto-save effect
  useEffect(() => {
    // Don't auto-save if we're loading a saved request or if it's the initial mount
    if (isInitialMount.current || selectedSavedRequestId) {
      return;
    }

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        // Only save if there's actual content
        if (promptData.request || promptData.context || promptData.codeInput) {
          await setCacheItem(AUTOSAVE_KEY, promptData);
        }
      } catch (error) {
        console.error('Failed to auto-save form state', error);
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [promptData, selectedSavedRequestId]);

  // Effect to save requests to IndexedDB when they change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const saveRequests = async () => {
      try {
        // Do not save if savedRequests is null or undefined to prevent corruption
        if (savedRequests === null || savedRequests === undefined) {
          return;
        }
        await setCacheItem('savedPromptRequests', savedRequests);
      } catch (error) {
        console.error('Failed to save requests to localStorage', error);
        toast.error('Could not save requests.');
      }
    };
    saveRequests();
  }, [savedRequests]);

  const clearForm = useCallback(() => {
    dispatch({ type: 'CLEAR_FORM' });
    // Clear auto-saved state when form is manually cleared
    setCacheItem(AUTOSAVE_KEY, initialState.promptData).catch((error) => {
      console.error('Failed to clear auto-saved state', error);
    });
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

  const showCustomCategory = useMemo(
    () => promptData.category === CUSTOM_CATEGORY_VALUE,
    [promptData.category],
  );

  const isGenerateDisabled = useMemo(() => {
    const { category, customCategory, request } = promptData;
    const requestIsEmpty = !request.trim();
    const categoryNotSelected = !category;
    const customCategoryIsEmptyWhenRequired =
      category === CUSTOM_CATEGORY_VALUE && !customCategory?.trim();

    return (
      categoryNotSelected || requestIsEmpty || customCategoryIsEmptyWhenRequired
    );
  }, [promptData]);

  const generatePromptHandler = useCallback(() => {
    executePromptGeneration(
      promptData,
      dispatch,
      async (dataForGenerator) => {
        const defaults =
          DEFAULT_PROMPT_TEXTS[
            dataForGenerator.category as keyof typeof DEFAULT_PROMPT_TEXTS
          ] || DEFAULT_PROMPT_TEXTS[''];
        const finalDataForUtility: PromptData = {
          ...dataForGenerator,
          context:
            dataForGenerator.context.trim() === ''
              ? defaults.defaultContext
              : dataForGenerator.context.trim(),
          request:
            dataForGenerator.request.trim() === ''
              ? defaults.defaultRequest
              : dataForGenerator.request.trim(),
          parentTask: dataForGenerator.parentTask.trim(),
          subtask: dataForGenerator.subtask.trim(),
        };
        return generatePrompt(finalDataForUtility);
      },
      'Prompt generated successfully!',
      'generating prompt',
      'SET_LOADING',
    );
  }, [promptData]);

  const generateAiPromptHandler = useCallback(() => {
    executePromptGeneration(
      promptData,
      dispatch,
      async (dataForApi) => {
        const response = await fetch('/api/generate-ai-prompt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...dataForApi,
            temperature: promptData.temperature,
            aiModel: promptData.aiModel,
            geminiApiKey: promptData.geminiApiKey,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(
            `HTTP error! Status: ${response.status}. Details: ${errorBody || 'No additional details.'}`,
          );
        }

        const result = await response.json();
        return result.generatedPrompt || '';
      },
      'AI-powered prompt generated successfully!',
      'AI prompt generation',
      'SET_AI_LOADING',
    );
  }, [promptData]);

  const copyToClipboard = useCallback(async () => {
    if (!output) return;

    try {
      await navigator.clipboard.writeText(output);
      dispatch({ type: 'SET_COPIED', payload: true });
      toast.success('Prompt copied to clipboard!');

      const timer = setTimeout(
        () => dispatch({ type: 'SET_COPIED', payload: false }),
        2000,
      );
      return () => clearTimeout(timer);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast.error('Failed to copy prompt to clipboard.');
      dispatch({ type: 'SET_COPIED', payload: false });
    }
  }, [output]);

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

    // Ensure savedRequests is an array before concatenation
    const updatedRequests = (savedRequests || []).concat(newRequest);

    dispatch({
      type: 'SET_SAVED_REQUESTS',
      payload: updatedRequests,
    });
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

  const cancelDeleteRequest = useCallback(() => {
    dispatch({ type: 'SET_REQUEST_PENDING_DELETION', payload: null });
  }, []);

  const isCopyDisabled = useMemo(() => !output || copied, [output, copied]);

  return {
    promptData,
    output,
    copied,
    loading,
    aiLoading,
    showSaveDialog,
    newRequestName,
    selectedSavedRequestId,
    validationErrors,
    savedRequests,
    requestPendingDeletion,
    // Renamed functions to match page expectations
    updatePromptData: (data: Partial<PromptData>) => {
      Object.entries(data).forEach(([key, value]) => {
        dispatch({
          type: 'SET_FIELD',
          field: key as keyof PromptData,
          value: value as string,
        });
      });
    },
    handleGeneratePrompt: generatePromptHandler,
    generateAiPromptHandler,
    handleCopyOutput: copyToClipboard,
    handleSaveRequest,
    handleDeleteRequest,
    handleLoadRequest,
    handleNewRequestNameChange: (name: string) =>
      dispatch({ type: 'SET_NEW_REQUEST_NAME', payload: name }),
    handleSaveDialogOpen: () =>
      dispatch({ type: 'SET_SHOW_SAVE_DIALOG', payload: true }),
    handleSaveDialogClose: () =>
      dispatch({ type: 'SET_SHOW_SAVE_DIALOG', payload: false }),
    clearForm,
    // Keep original functions for backward compatibility
    handleFieldChange,
    handleCategoryChange,
    showCustomCategory,
    isGenerateDisabled,
    copyToClipboard,
    confirmSaveRequest,
    isCopyDisabled,
    confirmDeleteRequest,
    cancelDeleteRequest,
    setNewRequestName: (name: string) =>
      dispatch({ type: 'SET_NEW_REQUEST_NAME', payload: name }),
    setShowSaveDialog: (show: boolean) =>
      dispatch({ type: 'SET_SHOW_SAVE_DIALOG', payload: show }),
    // Refs
    requestInputRef,
    contextInputRef,
    codeInputRef,
  };
};
