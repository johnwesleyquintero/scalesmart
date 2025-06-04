'use client';

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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

  // Generic handler factory for text input fields (Input and Textarea).
  const handleInputChange = useCallback(
    (field: keyof Omit<PromptData, 'category'>) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setPromptData((prev) => ({ ...prev, [field]: e.target.value }));
      },
    [], // Dependencies: none
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
  }, [promptData.category, promptData.customCategory, promptData.request]); // Dependencies on specific fields

  // Handler function to generate the prompt string.
  const generatePromptHandler = useCallback(() => {
    // --- Client-side Validation (Mirrors isGenerateDisabled logic) ---
    const { category, customCategory, request, context, codeInput } =
      promptData;

    if (!category) {
      toast.warning("Please select a 'Category'.");
      return;
    }
    if (!request.trim()) {
      toast.warning("The 'Request' field is required to generate a prompt.");
      return;
    }
    if (category === CUSTOM_CATEGORY_VALUE && !customCategory.trim()) {
      toast.warning("Please enter a value for the 'Custom Category'.");
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
                    onChange={handleInputChange('customCategory')}
                    className="bg-background border-border"
                    aria-required={showCustomCategory} // Indicate required state for screen readers
                  />
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
                onChange={handleInputChange('context')}
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
                onChange={handleInputChange('request')}
                rows={3}
                className="bg-background border-border"
                aria-required="true" // Indicate required state for screen readers
              />
            </div>

            {/* Code Input Textarea (optional) */}
            <div className="space-y-2">
              <Label htmlFor="codeInput">Relevant Code (optional)</Label>
              <Textarea
                id="codeInput"
                placeholder="Paste any relevant code snippets..."
                value={promptData.codeInput}
                onChange={handleInputChange('codeInput')}
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
                disabled={isGenerateDisabled} // Disable based on validation state
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Prompt
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
                <pre className="whitespace-pre-wrap text-muted-foreground">
                  {output}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
