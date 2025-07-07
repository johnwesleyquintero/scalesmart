import { useState, useCallback, useMemo, useEffect } from 'react';
import useDebounceCallback from './use-debounce-callback';
import { toast } from 'sonner';

import {
  CUSTOM_CATEGORY_VALUE,
  DEFAULT_PROMPT_TEXTS,
} from '@/lib/prompt-generator/constants';
import { CategoryValue, PromptData } from '@/lib/prompt-generator/types';
import { generatePrompt } from '@/lib/prompt-generator/utils';
import { useLocalStorage } from './use-local-storage';

import {
  SavedRequest,
  PromptDataKey,
} from '../app/prompt-request-generator/components/types';

const REQUIRED_CATEGORY_MESSAGE = "Please select a 'Category'.";
const REQUIRED_REQUEST_MESSAGE = "The 'Request' field is required.";
const REQUIRED_CUSTOM_CATEGORY_MESSAGE =
  "Please enter a value for the 'Custom Category'.";

/**
 * Validates the prompt data and returns an object containing any errors.
 * @param {PromptData} data - The prompt data to validate.
 * @returns {Partial<Record<keyof PromptData, string>>} An object with validation errors.
 */
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
  if (category === CUSTOM_CATEGORY_VALUE && !customCategory.trim()) {
    errors.customCategory = REQUIRED_CUSTOM_CATEGORY_MESSAGE;
  }
  return errors;
}

// Helper for common validation and loading setup
async function executePromptGeneration(
  promptData: PromptData,
  setValidationErrors: React.Dispatch<
    React.SetStateAction<Partial<Record<keyof PromptData, string>>>
  >,
  setOutput: React.Dispatch<React.SetStateAction<string>>,
  setLoadingState: React.Dispatch<React.SetStateAction<boolean>>,
  generatorFunction: (data: PromptData) => Promise<string>, // Or just string for local generatePrompt
  successMessage: string,
  errorMessagePrefix: string,
) {
  setLoadingState(true);
  setOutput('');

  const errors = validatePromptData(promptData);
  setValidationErrors(errors);

  if (Object.keys(errors).length > 0) {
    setLoadingState(false);
    toast.warning('Please fix the errors in the form.');
    return;
  }

  try {
    const generated = await generatorFunction(promptData);
    if (generated) {
      setOutput(generated);
      toast.success(successMessage);
    } else {
      setOutput('');
      toast.warning(
        'The generator did not return a prompt. Please try again or refine your request.',
      );
    }
  } catch (error) {
    console.error(`Error ${errorMessagePrefix}:`, error);
    const msg =
      error instanceof Error ? error.message : 'An unexpected error occurred.';
    toast.error(`${errorMessagePrefix}: ${msg}`);
    setOutput('');
  } finally {
    setLoadingState(false);
  }
}

export const usePromptGenerator = () => {
  // State for the prompt input data fields used for generation and validation.
  const [promptData, setPromptData] = useState<PromptData>({
    category: '',
    customCategory: '',
    context: '',
    request: '',
    parentTask: '',
    subtask: '',
    codeInput: '',
  });

  // Clear Form Handler
  const clearForm = useCallback(() => {
    setPromptData({
      category: '',
      customCategory: '',
      context: '',
      request: '',
      parentTask: '',
      subtask: '',
      codeInput: '',
    });
    setContextInput('');
    setRequestInput('');
    setParentTaskInput('');
    setSubtaskInput('');
    setCodeInput('');
    setCustomCategoryInput('');
    setOutput('');
    setValidationErrors({});
    setCopied(false);
    setSelectedSavedRequestId(null);
  }, []);

  // Local state for input fields to ensure smooth typing experience.
  const [contextInput, setContextInput] = useState('');
  const [requestInput, setRequestInput] = useState('');
  const [parentTaskInput, setParentTaskInput] = useState('');
  const [subtaskInput, setSubtaskInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [customCategoryInput, setCustomCategoryInput] = useState(''); // Added local state for customCategory

  // State for the generated output prompt string.
  const [output, setOutput] = useState('');

  // State for managing copy-to-clipboard button feedback.
  const [copied, setCopied] = useState(false);

  // State for loading indicators during prompt generation.
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // State for save dialog
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newRequestName, setNewRequestName] = useState('');
  const [selectedSavedRequestId, setSelectedSavedRequestId] = useState<
    string | null
  >(null);

  // State for validation errors.
  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<keyof PromptData, string>>
  >({});

  // Use useLocalStorage hook to persist saved requests
  const [savedRequests, setSavedRequests] = useLocalStorage<SavedRequest[]>(
    'savedPromptRequests',
    [],
  );

  // Debounced function to update promptData state and perform *minimal* validation (clearing errors).
  const debouncedSetPromptDataAndClearErrors = useDebounceCallback(
    (field: PromptDataKey, value: string) => {
      setPromptData((prev: PromptData) => ({
        ...prev,
        [field]: value,
      }));
      // Only clear the error if the field now has content. Full validation on submit.
      setValidationErrors((prev: Partial<Record<keyof PromptData, string>>) => {
        const newErrors = { ...prev };
        const trimmedValue = String(value).trim();
        if (
          (field === 'request' && trimmedValue) ||
          (field === 'customCategory' &&
            prev.category === CUSTOM_CATEGORY_VALUE &&
            trimmedValue)
        ) {
          newErrors[field] = undefined;
        }
        return newErrors;
      });
    },
    300,
  );

  // Wrapped in useCallback to ensure stability.
  const debouncedUpdatePromptData = useCallback(
    (field: PromptDataKey, value: string) => {
      debouncedSetPromptDataAndClearErrors(field, value);
    },
    [debouncedSetPromptDataAndClearErrors],
  );

  // Handler specifically for the category select component.
  // Manages the logic for showing/hiding the custom category input and clearing customCategory text.
  const handleCategoryChange = useCallback(
    (value: CategoryValue) => {
      setPromptData((prev: PromptData) => ({
        ...prev,
        category: value,
        // Clear custom category text if a standard category is selected.
        // Keep the existing customCategory text if 'custom' is selected.
        // We now rely on customCategoryInput local state, so this needs to update it too.
        customCategory:
          value !== CUSTOM_CATEGORY_VALUE ? '' : prev.customCategory,
      }));
      setCustomCategoryInput((prev: string) =>
        value !== CUSTOM_CATEGORY_VALUE ? '' : prev,
      ); // Sync local input state
      // Clear category validation error on change
      setValidationErrors(
        (prev: Partial<Record<keyof PromptData, string>>) => ({
          ...prev,
          category: undefined,
        }),
      );
      // If switching to a standard category, clear custom category error
      if (value !== CUSTOM_CATEGORY_VALUE) {
        setValidationErrors(
          (prev: Partial<Record<keyof PromptData, string>>) => ({
            ...prev,
            customCategory: undefined,
          }),
        );
      }
    },
    [], // Dependencies: CUSTOM_CATEGORY_VALUE was an unnecessary dependency.
  );

  // Determines if the custom category input field should be rendered.
  const showCustomCategory = useMemo(
    () => promptData.category === CUSTOM_CATEGORY_VALUE,
    [promptData.category],
  );

  // Determines if the Generate Prompt button should be disabled.
  const isGenerateDisabled = useMemo(() => {
    const { category, customCategory, request } = promptData;
    const requestIsEmpty = !request.trim();
    const categoryNotSelected = !category;
    const customCategoryIsEmptyWhenRequired =
      category === CUSTOM_CATEGORY_VALUE && !customCategory.trim();

    return (
      categoryNotSelected || requestIsEmpty || customCategoryIsEmptyWhenRequired
    );
  }, [promptData]);

  // Handler function to generate the prompt string.
  const generatePromptHandler = useCallback(() => {
    // Construct the data object using the *most current* local input states
    const dataToGenerate: PromptData = {
      category: promptData.category, // Category is updated instantly by handleCategoryChange
      customCategory: customCategoryInput, // Use local input state
      context: contextInput, // Use local input state
      request: requestInput, // Use local input state
      parentTask: parentTaskInput, // Use local input state
      subtask: subtaskInput, // Use local input state
      codeInput: codeInput, // Use local input state
    };

    executePromptGeneration(
      dataToGenerate, // Pass the immediately constructed data
      setValidationErrors,
      setOutput,
      setLoading,
      async (dataForGenerator) => {
        // dataForGenerator will now be dataToGenerate
        // Get default texts based on the selected category
        const defaults =
          DEFAULT_PROMPT_TEXTS[dataForGenerator.category] ||
          DEFAULT_PROMPT_TEXTS[''];

        // Prepare the data object to pass to the generation utility, applying defaults if needed
        const finalDataForUtility: PromptData = {
          ...dataForGenerator, // Start with the immediate data
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
    );
  }, [
    promptData.category,
    customCategoryInput,
    contextInput,
    requestInput,
    parentTaskInput,
    subtaskInput,
    codeInput,
  ]);

  const generateAiPromptHandler = useCallback(() => {
    // Construct the data object using the *most current* local input states
    const dataToGenerate: PromptData = {
      category: promptData.category,
      customCategory: customCategoryInput,
      context: contextInput,
      request: requestInput,
      parentTask: parentTaskInput,
      subtask: subtaskInput,
      codeInput: codeInput,
    };

    executePromptGeneration(
      dataToGenerate, // Pass the immediately constructed data
      setValidationErrors,
      setOutput,
      setAiLoading,
      async (dataForApi) => {
        // dataForApi will now be dataToGenerate
        const response = await fetch('/api/generate-ai-prompt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataForApi), // Use the immediate data for the API call
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
    );
  }, [
    promptData.category,
    customCategoryInput,
    contextInput,
    requestInput,
    parentTaskInput,
    subtaskInput,
    codeInput,
  ]);

  // Handler function to copy the generated output to the clipboard.
  const copyToClipboard = useCallback(async () => {
    if (!output) return;

    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      toast.success('Prompt copied to clipboard!');

      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast.error('Failed to copy prompt to clipboard.');
      setCopied(false);
    }
  }, [output]);

  // Handlers for saving and loading requests
  const handleSaveRequest = useCallback(() => {
    if (!requestInput.trim()) {
      toast.error('Cannot save an empty request.');
      return;
    }
    setNewRequestName('');
    setShowSaveDialog(true);
  }, [requestInput]);

  const confirmSaveRequest = useCallback(() => {
    if (!newRequestName.trim()) {
      toast.error('Please enter a name for your request.');
      return;
    }

    // Ensure promptData.request is up-to-date for saving
    const currentPromptDataForSave: PromptData = {
      ...promptData,
      context: contextInput,
      request: requestInput,
      parentTask: parentTaskInput,
      subtask: subtaskInput,
      codeInput: codeInput,
      customCategory: customCategoryInput,
    };

    const newRequest: SavedRequest = {
      id: Date.now().toString(),
      name: newRequestName.trim(),
      data: currentPromptDataForSave, // Save the entire promptData
    };

    // Ensure prev is an array before spreading
    setSavedRequests((prev) => [
      ...(Array.isArray(prev) ? prev : []),
      newRequest,
    ]);
    toast.success(`Request "${newRequest.name}" saved!`);
    setShowSaveDialog(false);
    setNewRequestName('');
  }, [
    newRequestName,
    promptData,
    contextInput,
    requestInput,
    parentTaskInput,
    subtaskInput,
    codeInput,
    customCategoryInput,
    setSavedRequests,
  ]);

  const handleLoadRequest = useCallback(
    (id: string) => {
      // Ensure savedRequests is an array before attempting to find the request
      if (!Array.isArray(savedRequests)) {
        console.error('savedRequests is not an array:', savedRequests);
        toast.error(
          'Failed to load request: Saved requests data is corrupted.',
        );
        return;
      }

      const requestToLoad = savedRequests.find((req) => req.id === id);

      if (requestToLoad) {
        const loadedData = requestToLoad.data;
        console.log('[usePromptGenerator] Loading data:', loadedData);

        // Update the main promptData state
        setPromptData(loadedData);

        // Update all corresponding local input states for immediate UI reflection
        setContextInput(loadedData.context);
        setRequestInput(loadedData.request);
        setParentTaskInput(loadedData.parentTask);
        setSubtaskInput(loadedData.subtask);
        setCodeInput(loadedData.codeInput);
        setCustomCategoryInput(loadedData.customCategory);

        // Manually handle category to ensure custom category input visibility is correct
        handleCategoryChange(loadedData.category); // This will also clear customCategoryInput if category is not custom

        toast.success(`Request "${requestToLoad.name}" loaded!`);
        setSelectedSavedRequestId(id);
        setValidationErrors({}); // Clear validation errors on load
      } else {
        toast.error('Selected request not found.');
      }
    },
    [savedRequests, handleCategoryChange], // handleCategoryChange is a stable ref, no issue
  );

  const handleDeleteRequest = useCallback(
    (id: string, name: string) => {
      // Ensure prev is an array before filtering
      setSavedRequests((prev) =>
        Array.isArray(prev) ? prev.filter((req) => req.id !== id) : [],
      );
      toast.success(`Request "${name}" deleted!`);
      if (selectedSavedRequestId === id) {
        setSelectedSavedRequestId(null);
        // Clear all form fields if the deleted request was the active one
        setPromptData({
          category: '',
          customCategory: '',
          context: '',
          request: '',
          parentTask: '',
          subtask: '',
          codeInput: '',
        });
        setContextInput('');
        setRequestInput('');
        setParentTaskInput('');
        setSubtaskInput('');
        setCodeInput('');
        setCustomCategoryInput('');
      }
    },
    [setSavedRequests, selectedSavedRequestId], // No need for setRequestInput or setPromptData directly, as state updates cover it
  );

  // Effect to set the initial selected saved request if requestInput matches one
  // This useEffect is quite comprehensive and handles cases well. With the changes to
  // handleLoadRequest and handleDeleteRequest to reset all input fields, this useEffect
  // becomes primarily responsible for updating the selectedSavedRequestId when the
  // requestInput (manually or via other means) happens to match a saved request.
  // It's robust for its purpose.
  useEffect(() => {
    // Safely access find on savedRequests
    if (requestInput && Array.isArray(savedRequests)) {
      const found = savedRequests.find(
        (req) => req.data.request === requestInput,
      );
      if (found && selectedSavedRequestId !== found.id) {
        setSelectedSavedRequestId(found.id);
      } else if (!found && selectedSavedRequestId !== null) {
        setSelectedSavedRequestId(null);
      }
    } else if (!requestInput && selectedSavedRequestId !== null) {
      // If requestInput is empty and a request was previously selected, deselect it
      setSelectedSavedRequestId(null);
    }
    // Note: The dependency array should include savedRequests
  }, [requestInput, savedRequests, selectedSavedRequestId]);

  // Determines if the Copy button should be disabled.
  const isCopyDisabled = useMemo(() => !output || copied, [output, copied]);

  return {
    promptData,
    setPromptData,
    clearForm,
    contextInput,
    setContextInput,
    requestInput,
    setRequestInput,
    parentTaskInput,
    setParentTaskInput,
    subtaskInput,
    setSubtaskInput,
    codeInput,
    setCodeInput,
    customCategoryInput,
    setCustomCategoryInput,
    output,
    setOutput,
    copied,
    setCopied,
    loading,
    setLoading,
    aiLoading,
    setAiLoading,
    showSaveDialog,
    setShowSaveDialog,
    newRequestName,
    setNewRequestName,
    selectedSavedRequestId,
    setSelectedSavedRequestId,
    validationErrors,
    setValidationErrors,
    savedRequests,
    setSavedRequests,
    debouncedUpdatePromptData,
    handleCategoryChange,
    showCustomCategory,
    isGenerateDisabled,
    generatePromptHandler,
    generateAiPromptHandler,
    copyToClipboard,
    handleSaveRequest,
    confirmSaveRequest,
    handleLoadRequest,
    handleDeleteRequest,
    isCopyDisabled,
  };
};
