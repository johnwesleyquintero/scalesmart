'use client';

import { useState, useCallback, useMemo } from 'react';
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
import { Copy, Wand2, ExternalLink } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

/**
 * A component for generating structured prompts based on user input for code assistance.
 * Allows selecting a category, providing context, describing the request, and including code snippets.
 */
export default function PromptRequestGenerator() {
  // State for the prompt input data fields.
  const [promptData, setPromptData] = useState<PromptData>({
    category: '',
    customCategory: '',
    context: '',
    request: '',
    codeInput: '',
  });

  // State for the generated output prompt string.
  const [output, setOutput] = useState('');

  // State for managing copy-to-clipboard button feedback.
  const [copied, setCopied] = useState(false);

  // State for loading indicator during prompt generation.
  const [loading, setLoading] = useState(false);

  // State for validation errors.
  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<keyof PromptData, string>>
  >({});

  // Debounced handler for text input fields to reduce frequent state updates and perform validation.
  // Debounced handler for text input fields to reduce frequent state updates and perform validation.
  const debouncedHandleInputChange = useDebounceCallback(
    (field: keyof Omit<PromptData, 'category'>, value: string) => {
      // Set the state with the raw value. Trimming is handled in generatePromptHandler.
      setPromptData((prev) => ({ ...prev, [field]: value }));

      // Perform validation for required fields on debounce
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        // Use the trimmed value for validation checks
        const trimmedValue = value.trim();
        if (field === 'request' && !trimmedValue) {
          newErrors.request = "The 'Request' field is required.";
        } else if (
          field === 'customCategory' &&
          promptData.category === CUSTOM_CATEGORY_VALUE &&
          !trimmedValue
        ) {
          newErrors.customCategory =
            "Please enter a value for the 'Custom Category'.";
        } else {
          // Clear validation error for this field if it's now valid
          newErrors[field] = undefined;
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
  }, [promptData]); // Depend on the entire promptData object

  // Handler function to generate the prompt string.
  const generatePromptHandler = useCallback(() => {
    setLoading(true); // Start loading
    setOutput(''); // Clear previous output

    // --- Client-side Validation ---
    const { category, customCategory, request, context, codeInput } =
      promptData;
    const errors: Partial<Record<keyof PromptData, string>> = {};

    if (!category) {
      errors.category = "Please select a 'Category'.";
    }
    if (!request.trim()) {
      errors.request = "The 'Request' field is required.";
    }
    if (category === CUSTOM_CATEGORY_VALUE && !customCategory.trim()) {
      errors.customCategory = "Please enter a value for the 'Custom Category'.";
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

  // Determines if the Copy button should be disabled.
  const isCopyDisabled = useMemo(() => !output || copied, [output, copied]);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background text-foreground">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">
            Prompt Request Generator
          </h1>
          <p className="text-muted-foreground mt-2">
            Create structured prompts for code assistance requests
          </p>
        </div>

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
                    className="bg-background border-border"
                    aria-label="Select category" // Accessibility label
                    aria-required="true" // Indicate required state
                  >
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    {/* Map over standard categories to create SelectItems */}
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                    {/* Add the 'Custom' option */}
                    <SelectItem value={CUSTOM_CATEGORY_VALUE}>
                      Custom
                    </SelectItem>
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
                    value={promptData.customCategory}
                    onChange={(e) =>
                      debouncedHandleInputChange(
                        'customCategory',
                        e.target.value,
                      )
                    }
                    className={`bg-background border-border ${validationErrors.customCategory ? 'border-red-500' : ''}`}
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
                value={promptData.context}
                onChange={(e) =>
                  debouncedHandleInputChange('context', e.target.value)
                }
                rows={3}
                className="bg-background border-border"
                aria-label="Context for the request (optional)"
              />
            </div>

            {/* Request Textarea (required) */}
            <div className="space-y-2">
              <Label htmlFor="request">
                Request <span className="text-red-500">*</span>
              </Label>
              {/* Indicate required */}
              <Textarea
                id="request"
                placeholder="Clearly describe what you need help with..."
                value={promptData.request}
                onChange={(e) =>
                  debouncedHandleInputChange('request', e.target.value)
                }
                rows={3}
                className={`bg-background border-border ${validationErrors.request ? 'border-red-500' : ''}`}
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

            {/* Code Input Textarea (optional) */}
            <div className="space-y-2">
              <Label htmlFor="codeInput">Relevant Code (optional)</Label>
              <Textarea
                id="codeInput"
                placeholder="Paste any relevant code snippets..."
                value={promptData.codeInput}
                onChange={(e) =>
                  debouncedHandleInputChange('codeInput', e.target.value)
                }
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
                disabled={isGenerateDisabled || loading} // Disable based on validation state or loading
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

              {/* Clear Form Button */}
              <Button
                variant="outline"
                onClick={() => {
                  setPromptData({
                    category: '',
                    customCategory: '',
                    context: '',
                    request: '',
                    codeInput: '',
                  });
                  setOutput(''); // Clear output as well
                  setValidationErrors({}); // Clear validation errors
                  setCopied(false); // Reset copied state
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
                <ExternalLink className="ml-2 h-4 w-4" />{' '}
                {/* External link icon */}
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Output Card (conditionally rendered when output is available) */}
        {output && (
          <Card className="bg-card border-border">
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
                {copied ? 'Copied!' : 'Copy'}{' '}
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
      </div>
    </div>
  );
}
