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

// --- Shared Types and Constants ---
// Ideally, these would be in a separate shared types/constants file.

// Define standard categories as a constant array for clarity and type safety.
const CATEGORIES = [
  'Code Refinement',
  'Error Fixing',
  'Code Generation',
  'Code Review',
  'Documentation',
  'Optimization',
  'Debugging',
  'Feature Implementation',
] as const; // Use 'as const' for a read-only tuple type

// Define a constant for the 'custom' category value used in the Select component state.
const CUSTOM_CATEGORY_VALUE = 'custom';

// Define the type for valid category values, including 'custom' and an empty string for the initial state.
type CategoryValue =
  | (typeof CATEGORIES)[number]
  | typeof CUSTOM_CATEGORY_VALUE
  | '';

// Type definition for prompt data fields used in the component state
// and expected by the generatePromptUtility function.
interface PromptData {
  category: CategoryValue; // Holds the selected standard category value or 'custom'
  customCategory: string; // Holds the user-defined custom category text (only relevant if category is 'custom')
  context: string; // Background information
  request: string; // The core request description (required)
  codeInput: string; // Relevant code snippet (optional)
}

// Define default texts based on categories for generating the prompt
// when corresponding user input fields are empty.
const DEFAULT_PROMPT_TEXTS: Record<
  CategoryValue,
  { defaultContext: string; defaultRequest: string }
> = {
  '': {
    // Default for initial state or when no standard/custom category is clearly resolved
    defaultContext:
      'Consider the overall context of a software development task.',
    defaultRequest:
      'Provide general AI assistance based on the input provided below.',
  },
  'Code Refinement': {
    defaultContext: 'Consider the context of a code refinement task.',
    defaultRequest:
      'Refine the provided code snippet for better readability, performance, or maintainability based on standard best practices.',
  },
  'Error Fixing': {
    defaultContext:
      'Consider the context of debugging and fixing a specific code error.',
    defaultRequest:
      'Analyze the provided code and error message to identify and fix the issue.',
  },
  'Code Generation': {
    defaultContext:
      'Consider the context of generating new code based on a specific requirement.',
    defaultRequest: 'Generate code based on the requirements described below.',
  },
  'Code Review': {
    defaultContext:
      'Consider the context of reviewing a code snippet for potential issues, improvements, and adherence to standards.',
    defaultRequest:
      'Perform a code review on the provided code snippet, identifying potential bugs, suggesting improvements, and ensuring best practices are followed.',
  },
  Documentation: {
    defaultContext:
      'Consider the context of generating or improving documentation for code or a technical concept.',
    defaultRequest:
      'Generate or improve documentation for the provided code or topic.',
  },
  Optimization: {
    defaultContext:
      'Consider the context of optimizing code for performance, resource usage, or efficiency.',
    defaultRequest:
      'Optimize the provided code snippet for performance and efficiency.',
  },
  Debugging: {
    defaultContext: 'Consider the context of debugging a software issue.',
    defaultRequest: 'Help debug the described problem and provided code.',
  },
  'Feature Implementation': {
    defaultContext:
      'Consider the context of implementing a new software feature.',
    defaultRequest:
      'Assist in implementing the described feature based on the provided details.',
  },
  [CUSTOM_CATEGORY_VALUE]: {
    // Use the constant for the 'custom' key
    defaultContext:
      'Consider the context of the custom category specified below.',
    defaultRequest:
      'Provide assistance based on the custom category and request details provided.',
  },
};

// --- Prompt Generation Utility ---
// This module is responsible for structuring the final prompt string.
// It depends on the shared types and constants defined above.

// Constants for markdown headings
const TASK_CATEGORY_HEADING = '### Task Category:';
const CONTEXT_HEADING = '#### Context';
const REQUEST_HEADING = '#### Request';
const CODE_HEADING = '#### Code';

// Map for introduction phrases based on standard category values
const INTRODUCTION_PHRASES: Record<(typeof CATEGORIES)[number] | '', string> = {
  '': 'I need general code assistance. ',
  'Code Refinement': 'I need assistance with refining existing code. ',
  'Error Fixing':
    'I am encountering an error in my code and require help with debugging. ',
  'Code Generation': 'I need help generating new code. ',
  'Code Review': 'I am requesting a review of the following code. ',
  Documentation: 'I require documentation for the following code or concept. ',
  Optimization:
    'I am looking for ways to optimize the provided code for performance or efficiency. ',
  Debugging: 'I need help debugging an issue. ',
  'Feature Implementation':
    'I am planning to implement a new feature and need guidance. ',
};

/**
 * Determines the introductory phrase based on the given category value.
 * Uses specific phrases for standard categories and a generic one for custom.
 * @param {CategoryValue} categoryValue - The value selected in the category dropdown.
 * @param {string} customCategoryText - The text entered for the custom category.
 * @returns {string} The appropriate introductory phrase.
 */
function getIntroductionPhrase(
  categoryValue: CategoryValue,
  customCategoryText: string,
): string {
  if (categoryValue === CUSTOM_CATEGORY_VALUE) {
    // Use the custom category text for the phrase if 'custom' is selected
    return `Regarding the "${customCategoryText.trim() || 'Custom'}" category, `;
  }
  // Use specific phrases for standard categories, fallback to generic if categoryValue is ''
  return INTRODUCTION_PHRASES[categoryValue] || INTRODUCTION_PHRASES[''];
}

/**
 * Attempts to detect the programming language of the provided code input using basic heuristics.
 * Note: This detection is not exhaustive or perfectly accurate.
 * @param {string} codeInput - The code string to analyze.
 * @returns {string} The detected language (e.g., 'typescript', 'html', 'json'), or 'plaintext' as a fallback.
 */
function detectLanguage(codeInput: string): string {
  const trimmedCode = codeInput.trim();
  if (!trimmedCode) {
    return 'plaintext'; // No code means no language to detect
  }

  // Basic heuristics - order matters for some cases
  // HTML/XML check
  if (
    trimmedCode.startsWith('<') &&
    trimmedCode.endsWith('>') &&
    /<\/?\w+>/.test(trimmedCode)
  ) {
    return 'html';
  }
  // JSON check
  if (
    (trimmedCode.startsWith('{') && trimmedCode.endsWith('}')) ||
    (trimmedCode.startsWith('[') && trimmedCode.endsWith(']'))
  ) {
    try {
      JSON.parse(trimmedCode);
      return 'json';
    } catch (e) {
      // Not valid JSON, continue
    }
  }
  // TypeScript/JavaScript check
  if (
    /\b(import|export|function|const|let|class|interface|async|await)\b/.test(
      trimmedCode,
    )
  ) {
    return 'typescript';
  }
  // Python check
  if (
    /\b(def|print|import)\b.*:/.test(trimmedCode) ||
    (/^\s*\w+\s*=/.test(trimmedCode) && !trimmedCode.includes(';'))
  ) {
    return 'python';
  }
  // Java check
  if (
    /\b(public|private|protected)\b.*\b(class|interface)\b/.test(trimmedCode) ||
    /\b(static|void|String)\b.*main\s*\(/.test(trimmedCode)
  ) {
    return 'java';
  }
  // PHP check
  if (
    trimmedCode.startsWith('<?php') ||
    /\b(function|echo|namespace)\b.*;/.test(trimmedCode)
  ) {
    return 'php';
  }
  // C/C++ check
  if (
    /#include\s*<.*>/.test(trimmedCode) ||
    /\b(int|void)\s*main\s*\(.*\)\s*\{/.test(trimmedCode)
  ) {
    return 'c';
  }
  // SQL check
  if (/\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE)\b/i.test(trimmedCode)) {
    return 'sql';
  }

  return 'plaintext'; // Default fallback
}

/**
 * Generates a structured prompt based on the provided data.
 * Includes sections for category, context, request, and code input.
 * Assumes the input data has been validated before calling.
 *
 * @param {PromptData} data - The input data for prompt generation.
 * @returns {string} The generated structured prompt.
 */
export function generatePrompt(data: PromptData): string {
  const { category, customCategory, context, request, codeInput } = data;
  let prompt = '';

  // Determine the category name for the heading based on the selected category value
  const categoryName =
    category === CUSTOM_CATEGORY_VALUE
      ? customCategory.trim()
      : category.trim();

  // Add category heading and an introductory phrase if a category is present
  if (categoryName) {
    prompt += `${TASK_CATEGORY_HEADING} ${categoryName}\n\n${getIntroductionPhrase(category, customCategory)}`;
  }

  // Add context section if provided (and not just whitespace)
  if (context && context.trim()) {
    prompt += `${CONTEXT_HEADING}\n\n${context.trim()}\n\n`;
  }

  // Add request section - assumed mandatory and non-empty based on UI validation
  prompt += `${REQUEST_HEADING}\n\n${request.trim()}\n\n`;

  // Add code input section if provided (and not just whitespace), with language placeholder
  if (codeInput && codeInput.trim()) {
    const language = detectLanguage(codeInput);
    prompt += `${CODE_HEADING}\n\n\`\`\`${language}\n${codeInput.trim()}\n\`\`\`\n`;
  }

  // Add a polite closing statement
  prompt += '\nThank you for your assistance!';

  return prompt;
}

// --- Prompt Request Generator Component ---
// This component uses the shared types/constants and the prompt generation utility.

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
          <h1 className="text-3xl font-bold">Prompt Request Generator</h1>
          <p className="text-muted-foreground mt-2">
            Create structured prompts for code assistance requests
          </p>
        </div>

        {/* Input Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
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
                <CardTitle>Generated Prompt</CardTitle>
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
