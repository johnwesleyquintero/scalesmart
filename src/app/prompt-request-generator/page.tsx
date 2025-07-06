'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import useDebounceCallback from '@/hooks/use-debounce-callback';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Copy, Wand2, ExternalLink, Save, FolderOpen } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { components } from '@/components/MdxRenderer';

import {
  CATEGORIES,
  CUSTOM_CATEGORY_VALUE,
  DEFAULT_PROMPT_TEXTS,
} from '@/lib/prompt-generator/constants';
import { CategoryValue, PromptData } from '@/lib/prompt-generator/types';
import { generatePrompt } from '@/lib/prompt-generator/utils';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface SavedRequest {
  id: string;
  name: string;
  request: string;
}

// Define a constant for the error border class to avoid duplication
const ERROR_BORDER_CLASS = 'border-red-500';

const REQUIRED_CATEGORY_MESSAGE = "Please select a 'Category'.";
const REQUIRED_REQUEST_MESSAGE = "The 'Request' field is required.";
const REQUIRED_CUSTOM_CATEGORY_MESSAGE =
  "Please enter a value for the 'Custom Category'.";

/**
 * A component for generating structured prompts based on user input for code assistance.
 * Allows selecting a category, providing context, describing the request, and including code snippets.
 */
export default function PromptRequestGenerator() {
  // State for the prompt input data fields used for generation and validation.
  const [promptData, setPromptData] = useState<PromptData>({
    category: '',
    customCategory: '',
    context: '',
    request: '',
    parentTask: '', // Initialize new field
    subtask: '', // Initialize new field
    codeInput: '',
  });

  // Local state for input fields to ensure smooth typing experience.
  const [contextInput, setContextInput] = useState('');
  const [requestInput, setRequestInput] = useState('');
  const [parentTaskInput, setParentTaskInput] = useState(''); // New state for parent task
  const [subtaskInput, setSubtaskInput] = useState(''); // New state for subtask
  const [codeInput, setCodeInput] = useState('');

  // State for the generated output prompt string.
  const [output, setOutput] = useState('');

  // State for managing copy-to-clipboard button feedback.
  const [copied, setCopied] = useState(false);

  // State for loading indicator during prompt generation.
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
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
    [], // Initial value for server-side rendering
  );

  type PromptDataKey =
    | 'customCategory'
    | 'context'
    | 'request'
    | 'parentTask'
    | 'subtask'
    | 'codeInput';

  // Debounced handler to update promptData state and perform validation based on local input state.
  const debouncedUpdatePromptData = useDebounceCallback<
    (field: PromptDataKey, value: string) => void
  >(
    (field, value) => {
      setPromptData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Perform validation for required fields on debounce
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        // Use the trimmed value for validation checks
        const trimmedValue = String(value).trim();
        if (field === 'request' && !trimmedValue) {
          newErrors.request = REQUIRED_REQUEST_MESSAGE;
        } else if (
          field === 'customCategory' &&
          promptData.category === CUSTOM_CATEGORY_VALUE &&
          !trimmedValue
        ) {
          newErrors.customCategory = REQUIRED_CUSTOM_CATEGORY_MESSAGE;
        } else {
          // Clear validation error for this field
          newErrors[field as PromptDataKey] = undefined;
        }
        return newErrors;
      });
    },
    300, // Debounce delay in ms
  );

  // Handler specifically for the category select component.
  // Manages the logic for showing/hiding the custom category input and clearing customCategory text.
  const handleCategoryChange = useCallback((value: CategoryValue) => {
    setPromptData((prev) => ({
      ...prev,
      category: value,
      // Clear custom category text if a standard category is selected.
      // Keep the existing customCategory text if 'custom' is selected.
      customCategory:
        value !== CUSTOM_CATEGORY_VALUE ? '' : prev.customCategory,
    }));
    // Clear category validation error on change
    setValidationErrors((prev) => ({ ...prev, category: undefined }));
    // If switching to a standard category, clear custom category error
    if (value !== CUSTOM_CATEGORY_VALUE) {
      setValidationErrors((prev) => ({ ...prev, customCategory: undefined }));
    }
  }, []); // Dependencies: none

  // Determines if the custom category input field should be rendered.
  const showCustomCategory = useMemo(
    () => promptData.category === CUSTOM_CATEGORY_VALUE,
    [promptData.category],
  );

  // Determines if the Generate Prompt button should be disabled.
  const isGenerateDisabled = useMemo(() => {
    const { category, customCategory, request } = promptData;
    const requestIsEmpty = !request.trim();
    const categoryNotSelected = !category; // Handles the initial '' state
    const customCategoryIsEmptyWhenRequired =
      category === CUSTOM_CATEGORY_VALUE && !customCategory.trim();

    return (
      categoryNotSelected || requestIsEmpty || customCategoryIsEmptyWhenRequired
    );
  }, [promptData]); // Dependency: Re-create if promptData changes.

  // Handler function to generate the prompt string.
  const generatePromptHandler = useCallback(() => {
    setLoading(true); // Start loading
    setOutput(''); // Clear previous output

    // --- Client-side Validation ---
    const {
      category,
      customCategory,
      request,
      context,
      parentTask,
      subtask,
      codeInput,
    } = promptData;
    const errors: Partial<Record<keyof PromptData, string>> = {};

    if (!category) {
      errors.category = REQUIRED_CATEGORY_MESSAGE;
    }
    if (!request.trim()) {
      errors.request = REQUIRED_REQUEST_MESSAGE;
    }
    if (category === CUSTOM_CATEGORY_VALUE && !customCategory.trim()) {
      errors.customCategory = REQUIRED_CUSTOM_CATEGORY_MESSAGE;
    }

    setValidationErrors(errors); // Update validation errors state

    // If there are any errors, stop the process
    if (Object.keys(errors).length > 0) {
      setLoading(false); // Stop loading
      toast.warning('Please fix the errors in the form.');
      return;
    }
    // --- End Validation ---

    try {
      // Get the default context and request texts based on the *selected* category value.
      // Fallback to the empty category defaults if the selected category somehow doesn't exist.
      const defaults =
        DEFAULT_PROMPT_TEXTS[category] || DEFAULT_PROMPT_TEXTS[''];

      // Prepare the data object to pass to the generation utility.
      // Use trimmed user input if not empty, otherwise use the corresponding default.
      const dataForGenerator: PromptData = {
        category: category, // Pass the selected category value (standard name or 'custom')
        customCategory: customCategory, // Pass the custom category text as-is (trimming handled by utility)
        context:
          context.trim() === '' ? defaults.defaultContext : context.trim(),
        // Note: Due to UI validation, request should not be empty here, but fallback is safe.
        request:
          request.trim() === '' ? defaults.defaultRequest : request.trim(),
        parentTask: parentTask.trim(), // Pass parent task as-is (trimming handled by utility)
        subtask: subtask.trim(), // Pass subtask as-is (trimming handled by utility)
        codeInput: codeInput, // Code input is passed as-is (trimming handled by utility)
      };

      // Call the external utility function to generate the prompt string.
      const generated = generatePrompt(dataForGenerator);
      setOutput(generated); // Update the output state with the generated prompt.
      toast.success('Prompt generated successfully!'); // Show success notification.
    } catch (error) {
      // Catch and handle potential errors during prompt generation (e.g., unexpected utility issues).
      console.error('Error generating prompt:', error); // Log the full error for debugging.
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred.';
      toast.error(`Error generating prompt: ${errorMessage}`); // Show specific or generic error message.
      setOutput(''); // Clear previous output on error to prevent showing stale data.
    } finally {
      setLoading(false); // Stop loading regardless of success or failure
    }
  }, [promptData]); // Dependency: Re-create if promptData changes.

  const generateAiPromptHandler = useCallback(async () => {
    setAiLoading(true);
    setOutput('');

    const {
      category,
      customCategory,
      request,
      context,
      parentTask,
      subtask,
      codeInput,
    } = promptData;
    const errors: Partial<Record<keyof PromptData, string>> = {};

    if (!category) {
      errors.category = REQUIRED_CATEGORY_MESSAGE;
    }
    if (!request.trim()) {
      errors.request = REQUIRED_REQUEST_MESSAGE;
    }
    if (category === CUSTOM_CATEGORY_VALUE && !customCategory.trim()) {
      errors.customCategory = REQUIRED_CUSTOM_CATEGORY_MESSAGE;
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      setAiLoading(false);
      toast.warning('Please fix the errors in the form.');
      return;
    }

    try {
      const response = await fetch('/api/generate-ai-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promptData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.generatedPrompt) {
        setOutput(result.generatedPrompt);
        toast.success('AI-powered prompt generated successfully!');
      } else {
        setOutput('');
        toast.warning(
          'AI did not return a prompt. Please try again or refine your request.',
        );
      }
    } catch (error) {
      console.error('Error generating AI prompt:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred.';
      toast.error(`Error generating AI prompt: ${errorMessage}`);
      setOutput('');
    } finally {
      setAiLoading(false);
    }
  }, [promptData]);

  // Handler function to copy the generated output to the clipboard.
  const copyToClipboard = useCallback(async () => {
    if (!output) return; // Only attempt to copy if there is output content.

    try {
      await navigator.clipboard.writeText(output); // Use the Clipboard API.
      setCopied(true); // Set copied state for UI feedback.
      toast.success('Prompt copied to clipboard!'); // Show success notification.

      // Reset the copied state after a short delay.
      const timer = setTimeout(() => setCopied(false), 2000);

      // Cleanup function for the timer.
      return () => clearTimeout(timer);
    } catch (err) {
      // Handle potential errors during the copy operation.
      console.error('Failed to copy text: ', err); // Log error for debugging.
      toast.error('Failed to copy prompt to clipboard.'); // Show error notification.
      setCopied(false); // Ensure copied state is false if the operation failed.
    }
  }, [output]); // Dependency: Re-create if output changes.

  // Handlers for saving and loading requests
  const handleSaveRequest = useCallback(() => {
    if (!requestInput.trim()) {
      toast.error('Cannot save an empty request.');
      return;
    }
    setNewRequestName(''); // Clear previous name
    setShowSaveDialog(true);
  }, [requestInput]);

  const confirmSaveRequest = useCallback(() => {
    if (!newRequestName.trim()) {
      toast.error('Please enter a name for your request.');
      return;
    }

    const newRequest: SavedRequest = {
      id: Date.now().toString(), // Simple unique ID
      name: newRequestName.trim(),
      request: requestInput,
    };

    setSavedRequests((prev) => [...(prev || []), newRequest]);
    toast.success(`Request "${newRequest.name}" saved!`);
    setShowSaveDialog(false);
    setNewRequestName('');
  }, [newRequestName, requestInput, setSavedRequests]);

  const handleLoadRequest = useCallback(
    (id: string) => {
      const requestToLoad = savedRequests?.find((req) => req.id === id);
      if (requestToLoad) {
        setRequestInput(requestToLoad.request);
        debouncedUpdatePromptData('request', requestToLoad.request);
        toast.success(`Request "${requestToLoad.name}" loaded!`);
        setSelectedSavedRequestId(id); // Update selected state
      } else {
        toast.error('Selected request not found.');
      }
    },
    [savedRequests, setRequestInput, debouncedUpdatePromptData],
  );

  // Effect to set the initial selected saved request if requestInput matches one
  useEffect(() => {
    if (requestInput && savedRequests) {
      const found = savedRequests.find((req) => req.request === requestInput);
      if (found && selectedSavedRequestId !== found.id) {
        setSelectedSavedRequestId(found.id);
      } else if (!found && selectedSavedRequestId !== null) {
        setSelectedSavedRequestId(null); // Clear selection if requestInput no longer matches a saved one
      }
    } else if (!requestInput && selectedSavedRequestId !== null) {
      setSelectedSavedRequestId(null); // Clear selection if requestInput is empty
    }
  }, [requestInput, savedRequests, selectedSavedRequestId]);

  // Determines if the Copy button should be disabled.
  const isCopyDisabled = useMemo(() => !output || copied, [output, copied]);

  return (
    <div className="container mx-auto p-4">
      <div className="bg-card p-6 rounded-lg shadow-md">
        {' '}
        {/* Main content wrapper */}
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Prompt Request Generator
          </h1>
          <p className="text-muted-foreground mt-2">
            Create structured prompts for any assistance requests
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Check our new AI assistant:
            <Link
              href="https://wesai-pa.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 text-blue-500 hover:underline inline-flex items-center"
            >
              WesAI Personal Assistant
              <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </p>
        </div>
        <div className="space-y-6">
          {' '}
          {/* Wrapper for input and output cards */}
          {/* Input Card */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Request Details</CardTitle>
              <CardDescription className="text-muted-foreground">
                Fill in the sections below to generate a well-structured prompt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category Select */}
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  {/* Indicate required */}
                  <Select
                    value={promptData.category}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger
                      id="category"
                      className={`bg-background border-border ${validationErrors.category ? ERROR_BORDER_CLASS : ''}`}
                      aria-required="true"
                      aria-invalid={!!validationErrors.category}
                      aria-describedby={
                        validationErrors.category ? 'category-error' : undefined
                      }
                    >
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      {CATEGORIES.map((category) => (
                        <SelectItem
                          key={category}
                          value={category}
                          label={category}
                        >
                          {category}
                        </SelectItem>
                      ))}
                      <SelectItem value={CUSTOM_CATEGORY_VALUE} label="Custom">
                        Custom
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {validationErrors.category && (
                    <p
                      id="category-error"
                      className="text-red-500 text-sm mt-1"
                    >
                      {validationErrors.category}
                    </p>
                  )}
                </div>

                {/* Load Saved Request Select */}
                <div className="space-y-2">
                  <Label htmlFor="loadRequest">Load Saved Request</Label>
                  <Select
                    value={selectedSavedRequestId || ''}
                    onValueChange={handleLoadRequest}
                  >
                    <SelectTrigger
                      id="loadRequest"
                      className="bg-background border-border"
                      aria-label="Load a previously saved request"
                    >
                      <SelectValue placeholder="Select a saved request" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      {savedRequests && savedRequests.length > 0 ? (
                        savedRequests.map((req) => (
                          <SelectItem
                            key={req.id}
                            value={req.id}
                            label={req.name}
                          >
                            {req.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem
                          value="no-requests"
                          disabled
                          label="No saved requests"
                        >
                          No saved requests
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Category Input (conditionally rendered) */}
                {showCustomCategory && (
                  <div className="space-y-2">
                    <Label htmlFor="customCategory">
                      Custom Category <span className="text-red-500">*</span>
                    </Label>
                    {/* Indicate required */}
                    <Input
                      id="customCategory"
                      placeholder="e.g., AI Agent Development"
                      value={promptData.customCategory} // This input still directly updates promptData as it's not debounced for typing smoothness
                      onChange={(e) =>
                        setPromptData((prev) => ({
                          ...prev,
                          customCategory: e.target.value,
                        }))
                      }
                      onBlur={(e) =>
                        // Trigger validation on blur for custom category
                        debouncedUpdatePromptData(
                          'customCategory',
                          e.target.value,
                        )
                      }
                      className={`bg-background border-border ${validationErrors.customCategory ? ERROR_BORDER_CLASS : ''}`}
                      aria-required={showCustomCategory} // Indicate required state for screen readers
                      aria-invalid={!!validationErrors.customCategory} // Indicate invalid state for screen readers
                      aria-describedby={
                        validationErrors.customCategory
                          ? 'custom-category-error'
                          : undefined
                      } // Link to error message
                    />
                    {validationErrors.customCategory && (
                      <p
                        id="custom-category-error"
                        className="text-red-500 text-sm mt-1"
                      >
                        {validationErrors.customCategory}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Context Textarea */}
              <div className="space-y-2">
                <Label htmlFor="context">Context (optional)</Label>
                <Textarea
                  id="context"
                  placeholder="Provide background information about your project or problem..."
                  value={contextInput}
                  onChange={(e) => {
                    setContextInput(e.target.value);
                    debouncedUpdatePromptData('context', e.target.value);
                  }}
                  rows={3}
                  className="bg-background border-border font-mono"
                  aria-label="Context for the request (optional)"
                />
              </div>

              {/* Request Textarea */}
              <div className="space-y-2">
                <Label htmlFor="request">
                  Request <span className="text-red-500">*</span>
                </Label>
                {/* Indicate required */}
                <Textarea
                  id="request"
                  placeholder="Clearly describe what you need help with..."
                  value={requestInput}
                  onChange={(e) => {
                    setRequestInput(e.target.value);
                    debouncedUpdatePromptData('request', e.target.value);
                  }}
                  rows={3}
                  className={`bg-background border-border font-mono ${validationErrors.request ? ERROR_BORDER_CLASS : ''}`}
                  aria-required="true" // Indicate required state for screen readers
                  aria-invalid={!!validationErrors.request} // Indicate invalid state for screen readers
                  aria-describedby={
                    validationErrors.request ? 'request-error' : undefined
                  } // Link to error message
                />
                {validationErrors.request && (
                  <p id="request-error" className="text-red-500 text-sm mt-1">
                    {validationErrors.request}
                  </p>
                )}
              </div>

              {/* Parent Task Input */}
              <div className="space-y-2">
                <Label htmlFor="parentTask">Parent Task (optional)</Label>
                <Input
                  id="parentTask"
                  placeholder="e.g., Implement user authentication"
                  value={parentTaskInput}
                  onChange={(e) => {
                    setParentTaskInput(e.target.value);
                    debouncedUpdatePromptData('parentTask', e.target.value);
                  }}
                  className="bg-background border-border font-mono"
                  aria-label="Parent task for the request (optional)"
                />
              </div>

              {/* Subtask Input */}
              <div className="space-y-2">
                <Label htmlFor="subtask">Subtask (optional)</Label>
                <Input
                  id="subtask"
                  placeholder="e.g., Create login form UI"
                  value={subtaskInput}
                  onChange={(e) => {
                    setSubtaskInput(e.target.value);
                    debouncedUpdatePromptData('subtask', e.target.value);
                  }}
                  className="bg-background border-border font-mono"
                  aria-label="Subtask for the request (optional)"
                />
              </div>

              {/* Code Input Textarea */}
              <div className="space-y-2">
                <Label htmlFor="codeInput">Relevant Data (optional)</Label>
                <Textarea
                  id="codeInput"
                  placeholder="Paste any relevant data (code, CSV, JSON, logs, markdown, etc.)..."
                  value={codeInput}
                  onChange={(e) => {
                    setCodeInput(e.target.value);
                    debouncedUpdatePromptData('codeInput', e.target.value);
                  }}
                  rows={5}
                  className="bg-background border-border font-mono"
                  aria-label="Relevant code snippet (optional)"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col md:flex-row gap-4">
                {/* Generate Prompt Button */}
                <Button
                  onClick={generatePromptHandler} // Use the renamed handler
                  className="w-full md:w-auto"
                  aria-label="Generate prompt based on details"
                  disabled={isGenerateDisabled || loading || aiLoading} // Disable based on validation state or loading
                >
                  {loading ? (
                    'Generating...'
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Prompt
                    </>
                  )}
                </Button>
                <Button
                  onClick={generateAiPromptHandler}
                  disabled={isGenerateDisabled || aiLoading || loading}
                  className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                  aria-label="Generate prompt using AI (Gemini)"
                >
                  {aiLoading
                    ? 'Generating with AI...'
                    : 'Generate with AI (Gemini)'}
                </Button>

                {/* Save Request Button */}
                <Button
                  variant="outline"
                  onClick={handleSaveRequest}
                  className="w-full md:w-auto"
                  aria-label="Save current request to local storage"
                  disabled={!requestInput.trim()} // Disable if request is empty
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Request
                </Button>

                {/* Clear Form Button */}
                <Button
                  variant="outline"
                  onClick={() => {
                    setPromptData({
                      category: '',
                      customCategory: '',
                      context: '',
                      request: '',
                      parentTask: '', // Clear new field
                      subtask: '', // Clear new field
                      codeInput: '',
                    });
                    setContextInput(''); // Clear local state
                    setRequestInput(''); // Clear local state
                    setParentTaskInput(''); // Clear new local state
                    setSubtaskInput(''); // Clear new local state
                    setCodeInput(''); // Clear local state
                    setOutput(''); // Clear output as well
                    setValidationErrors({}); // Clear validation errors
                    setCopied(false); // Reset copied state
                    setSelectedSavedRequestId(null); // Clear selected saved request
                  }}
                  className="w-full md:w-auto"
                  aria-label="Clear all form fields"
                >
                  Clear Form
                </Button>

                {/* Link to External AI Assistant */}
                <Link
                  href="https://wesai.netlify.app/" // External link URL
                  target="_blank" // Open in new tab
                  rel="noopener noreferrer" // Security best practice for target="_blank"
                  // Apply Shadcn button styles using Tailwind classes
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-9 px-4 py-2 w-full md:w-auto"
                  aria-label="Open WesAI Code Assistant in a new tab" // Accessibility label
                >
                  WesAI Code Assistant
                  <ExternalLink className="ml-2 h-4 w-4" />
                  {/* External link icon */}
                </Link>
              </div>
            </CardContent>
          </Card>
          {/* Output Card (conditionally rendered when output is available) */}
          {output && (
            <Card className="bg-card border-border mt-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">
                    Generated Prompt
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Ready to copy and use
                  </CardDescription>
                </div>
                {/* Copy Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  disabled={isCopyDisabled} // Disable if no output or already copied
                  aria-label="Copy generated prompt to clipboard" // Accessibility label
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {copied ? 'Copied!' : 'Copy'}
                  {/* Button text changes on copy */}
                </Button>
              </CardHeader>
              <CardContent>
                {/* Output Display Area */}
                <div className="bg-muted p-4 rounded-md font-mono text-sm overflow-y-auto max-h-[300px]">
                  <ReactMarkdown
                    components={components}
                    remarkPlugins={[remarkGfm]}
                  >
                    {output}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Save Request Dialog */}
          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  Save Request
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Enter a name for your saved request.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="requestName" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="requestName"
                    value={newRequestName}
                    onChange={(e) => setNewRequestName(e.target.value)}
                    className="col-span-3 bg-background border-border"
                    placeholder="e.g., My Common Bug Fix Request"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowSaveDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={confirmSaveRequest}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
