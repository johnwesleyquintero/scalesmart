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

// REFACTOR: Consolidate local input state into a single object for easier management.
interface LocalInputs {
  context: string;
  request: string;
  parentTask: string;
  subtask: string;
  codeInput: string;
  customCategory: string;
}

const ERROR_BORDER_CLASS = 'border-red-500';

const REQUIRED_CATEGORY_MESSAGE = "Please select a 'Category'.";
const REQUIRED_REQUEST_MESSAGE = "The 'Request' field is required.";
const REQUIRED_CUSTOM_CATEGORY_MESSAGE =
  "Please enter a value for the 'Custom Category'.";

/**
 * Validates the prompt data and returns an object containing any errors.
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

export default function PromptRequestGenerator() {
  // "Source of Truth" state for prompt generation
  const [promptData, setPromptData] = useState<PromptData>({
    category: '',
    customCategory: '',
    context: '',
    request: '',
    parentTask: '',
    subtask: '',
    codeInput: '',
  });

  // REFACTOR: Consolidated local state for all text inputs for a cleaner component.
  // This state reflects what's in the UI fields directly.
  const [localInputs, setLocalInputs] = useState<LocalInputs>({
    context: '',
    request: '',
    parentTask: '',
    subtask: '',
    codeInput: '',
    customCategory: '',
  });

  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newRequestName, setNewRequestName] = useState('');
  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<keyof PromptData, string>>
  >({});

  // Local Storage State
  const [savedRequests, setSavedRequests] = useLocalStorage<SavedRequest[]>(
    'savedPromptRequests',
    [],
  );
  const [selectedSavedRequestId, setSelectedSavedRequestId] = useState<
    string | null
  >(null);

  // Debounced handler to update the main `promptData` state from local UI inputs.
  const debouncedUpdatePromptData = useDebounceCallback(
    (field: keyof PromptData, value: string) => {
      setPromptData((prev) => ({ ...prev, [field]: value }));
    },
    300,
  );

  // REFACTOR: Unified handler for all text inputs.
  const handleInputChange = useCallback(
    (field: keyof LocalInputs, value: string) => {
      // 1. Update the local input state immediately for a responsive UI
      setLocalInputs((prev) => ({ ...prev, [field]: value }));

      // 2. Debounce the update to the main `promptData` state
      debouncedUpdatePromptData(field, value);

      // FIX: Clear the validation error for this field as soon as the user starts typing.
      // This stops the error message from persisting while the user is fixing it.
      if (validationErrors[field as keyof typeof validationErrors]) {
        setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
      }

      // FIX: If the user edits the request field, deselect the "Saved Request".
      // This makes the behavior explicit and removes the need for a complex useEffect.
      if (field === 'request') {
        setSelectedSavedRequestId(null);
      }
    },
    [debouncedUpdatePromptData, validationErrors],
  );

  const handleCategoryChange = useCallback((value: CategoryValue) => {
    const isCustom = value === CUSTOM_CATEGORY_VALUE;

    setPromptData((prev) => ({
      ...prev,
      category: value,
      customCategory: isCustom ? prev.customCategory : '',
    }));

    // Clear validation error for category
    setValidationErrors((prev) => ({ ...prev, category: undefined }));

    if (!isCustom) {
      // If switching away from custom, clear the custom category input and any errors
      setLocalInputs((prev) => ({ ...prev, customCategory: '' }));
      setValidationErrors((prev) => ({ ...prev, customCategory: undefined }));
    }
  }, []);

  const showCustomCategory = useMemo(
    () => promptData.category === CUSTOM_CATEGORY_VALUE,
    [promptData.category],
  );

  const isGenerateDisabled = useMemo(() => {
    const { category, customCategory, request } = promptData;
    return (
      !category ||
      !request.trim() ||
      (category === CUSTOM_CATEGORY_VALUE && !customCategory.trim())
    );
  }, [promptData]);

  // REFACTOR: Central validation logic to be called by generation handlers.
  const isFormValid = useCallback(() => {
    const errors = validatePromptData(promptData);
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.warning('Please fix the errors in the form.');
      return false;
    }
    return true;
  }, [promptData]);

  const generatePromptHandler = useCallback(() => {
    // FIX: Validation is now only checked on explicit user action.
    if (!isFormValid()) return;

    setLoading(true);
    setOutput('');

    try {
      const defaults =
        DEFAULT_PROMPT_TEXTS[promptData.category] || DEFAULT_PROMPT_TEXTS[''];
      const dataForGenerator: PromptData = {
        ...promptData,
        context:
          promptData.context.trim() === ''
            ? defaults.defaultContext
            : promptData.context,
        request:
          promptData.request.trim() === ''
            ? defaults.defaultRequest
            : promptData.request,
      };

      const generated = generatePrompt(dataForGenerator);
      setOutput(generated);
      toast.success('Prompt generated successfully!');
    } catch (error) {
      console.error('Error generating prompt:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred.';
      toast.error(`Error generating prompt: ${errorMessage}`);
      setOutput('');
    } finally {
      setLoading(false);
    }
  }, [promptData, isFormValid]);

  const generateAiPromptHandler = useCallback(async () => {
    if (!isFormValid()) return;

    setAiLoading(true);
    setOutput('');

    try {
      const response = await fetch('/api/generate-ai-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promptData),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `HTTP error! Status: ${response.status}. Details: ${errorBody || 'No details.'}`,
        );
      }

      const result = await response.json();
      if (result.generatedPrompt) {
        setOutput(result.generatedPrompt);
        toast.success('AI-powered prompt generated successfully!');
      } else {
        throw new Error('AI did not return a prompt. Please try again.');
      }
    } catch (error) {
      console.error('Error generating AI prompt:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred.';
      toast.error(`AI Prompt Error: ${errorMessage}`);
      setOutput('');
    } finally {
      setAiLoading(false);
    }
  }, [promptData, isFormValid]);

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

  // REFACTOR: Simplified Local Storage Logic
  const handleSaveRequest = useCallback(() => {
    if (!localInputs.request.trim()) {
      toast.error('Cannot save an empty request.');
      return;
    }
    setNewRequestName('');
    setShowSaveDialog(true);
  }, [localInputs.request]);

  const confirmSaveRequest = useCallback(() => {
    if (!newRequestName.trim()) {
      toast.error('Please enter a name for your request.');
      return;
    }
    const newRequest: SavedRequest = {
      id: Date.now().toString(),
      name: newRequestName.trim(),
      request: localInputs.request,
    };
    const updatedRequests = [...(savedRequests || []), newRequest];
    setSavedRequests(updatedRequests);
    setSelectedSavedRequestId(newRequest.id); // Select the newly saved request
    toast.success(`Request "${newRequest.name}" saved!`);
    setShowSaveDialog(false);
  }, [newRequestName, localInputs.request, setSavedRequests, savedRequests]);

  const handleLoadRequest = useCallback(
    (id: string) => {
      const requestToLoad = Array.isArray(savedRequests)
        ? savedRequests.find((req) => req.id === id)
        : undefined;
      if (requestToLoad) {
        handleInputChange('request', requestToLoad.request);
        setSelectedSavedRequestId(id);
        toast.success(`Request "${requestToLoad.name}" loaded!`);
      }
    },
    [savedRequests, handleInputChange],
  );

  // REFACTOR: Extracted clear form logic into its own handler for cleanliness.
  const handleClearForm = useCallback(() => {
    setPromptData({
      category: '',
      customCategory: '',
      context: '',
      request: '',
      parentTask: '',
      subtask: '',
      codeInput: '',
    });
    setLocalInputs({
      context: '',
      request: '',
      parentTask: '',
      subtask: '',
      codeInput: '',
      customCategory: '',
    });
    setOutput('');
    setValidationErrors({});
    setCopied(false);
    setSelectedSavedRequestId(null);
  }, []);

  const isCopyDisabled = useMemo(() => !output || copied, [output, copied]);

  return (
    <div className="container mx-auto p-4">
      <div className="bg-card p-6 rounded-lg shadow-md">
        <div className="text-center mb-8">{/* Header remains the same */}</div>
        <div className="space-y-6">
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
                  <Select
                    value={promptData.category}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger
                      id="category"
                      className={`bg-background border-border ${validationErrors.category ? ERROR_BORDER_CLASS : ''}`}
                    >
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat} label={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                      <SelectItem value={CUSTOM_CATEGORY_VALUE} label="Custom">
                        Custom
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {validationErrors.category && (
                    <p className="text-red-500 text-sm mt-1">
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
                    >
                      <SelectValue placeholder="Select a saved request" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      {Array.isArray(savedRequests) &&
                      savedRequests.length > 0 ? (
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

                {/* Custom Category Input */}
                {showCustomCategory && (
                  <div className="space-y-2">
                    <Label htmlFor="customCategory">
                      Custom Category <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="customCategory"
                      placeholder="e.g., AI Agent Development"
                      value={localInputs.customCategory}
                      onChange={(e) =>
                        handleInputChange('customCategory', e.target.value)
                      }
                      className={`bg-background border-border ${validationErrors.customCategory ? ERROR_BORDER_CLASS : ''}`}
                    />
                    {validationErrors.customCategory && (
                      <p className="text-red-500 text-sm mt-1">
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
                  value={localInputs.context}
                  onChange={(e) => handleInputChange('context', e.target.value)}
                  rows={3}
                  className="bg-background border-border font-mono"
                />
              </div>

              {/* Request Textarea */}
              <div className="space-y-2">
                <Label htmlFor="request">
                  Request <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="request"
                  value={localInputs.request}
                  onChange={(e) => handleInputChange('request', e.target.value)}
                  rows={3}
                  className={`bg-background border-border font-mono ${validationErrors.request ? ERROR_BORDER_CLASS : ''}`}
                />
                {validationErrors.request && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.request}
                  </p>
                )}
              </div>

              {/* Parent Task Input */}
              <div className="space-y-2">
                <Label htmlFor="parentTask">Parent Task (optional)</Label>
                <Input
                  id="parentTask"
                  value={localInputs.parentTask}
                  onChange={(e) =>
                    handleInputChange('parentTask', e.target.value)
                  }
                  className="bg-background border-border font-mono"
                />
              </div>

              {/* Subtask Input */}
              <div className="space-y-2">
                <Label htmlFor="subtask">Subtask (optional)</Label>
                <Input
                  id="subtask"
                  value={localInputs.subtask}
                  onChange={(e) => handleInputChange('subtask', e.target.value)}
                  className="bg-background border-border font-mono"
                />
              </div>

              {/* Code Input Textarea */}
              <div className="space-y-2">
                <Label htmlFor="codeInput">Relevant Data (optional)</Label>
                <Textarea
                  id="codeInput"
                  value={localInputs.codeInput}
                  onChange={(e) =>
                    handleInputChange('codeInput', e.target.value)
                  }
                  rows={5}
                  className="bg-background border-border font-mono"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col md:flex-row gap-4">
                <Button
                  onClick={generatePromptHandler}
                  disabled={isGenerateDisabled || loading || aiLoading}
                >
                  {loading ? (
                    'Generating...'
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" /> Generate Prompt
                    </>
                  )}
                </Button>
                <Button
                  onClick={generateAiPromptHandler}
                  disabled={isGenerateDisabled || aiLoading || loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {aiLoading
                    ? 'Generating with AI...'
                    : 'Generate with AI (Gemini)'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSaveRequest}
                  disabled={!localInputs.request.trim()}
                >
                  <Save className="mr-2 h-4 w-4" /> Save Request
                </Button>
                <Button variant="outline" onClick={handleClearForm}>
                  Clear Form
                </Button>
                {/* Links remain the same */}
              </div>
            </CardContent>
          </Card>

          {/* Output Card */}
          {output && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Generated Prompt
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Use the button below to copy the generated prompt.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="prose dark:prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={components}
                    >
                      {output}
                    </ReactMarkdown>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={copyToClipboard}
                    disabled={isCopyDisabled}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save Dialog */}
          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Request</DialogTitle>
                <DialogDescription>
                  Enter a name for your request to save it for later use.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="newRequestName">Request Name</Label>
                  <Input
                    id="newRequestName"
                    value={newRequestName}
                    onChange={(e) => setNewRequestName(e.target.value)}
                    placeholder="e.g., My Cool Prompt Request"
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
