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

// Import the modular prompt generation utility (assuming this exists at the specified path)
import { generatePrompt as generatePromptUtility } from '@/lib/prompt-generator/promptGenerator';

// Type definitions for prompt data fields
interface PromptData {
  category: string;
  customCategory: string;
  context: string;
  request: string;
  codeInput: string;
}

// Define categories as a constant array of strings for clarity and type safety
const CATEGORIES = [
  'Code Refinement',
  'Error Fixing',
  'Code Generation',
  'Code Review',
  'Documentation',
  'Optimization',
  'Debugging',
  'Feature Implementation',
] as const; // Use 'as const' for read-only tuple type

// Define the type for valid category values, including 'custom'
type CategoryValue = (typeof CATEGORIES)[number] | 'custom';

/**
 * A component for generating structured prompts based on user input for code assistance.
 * Allows selecting a category, providing context, describing the request, and including code snippets.
 */
export default function PromptRequestGenerator() {
  // State for the prompt input data
  const [promptData, setPromptData] = useState<PromptData>({
    category: '',
    customCategory: '',
    context: '',
    request: '',
    codeInput: '',
  });
  // State for the generated output prompt
  const [output, setOutput] = useState('');
  // State for copy-to-clipboard button feedback
  const [copied, setCopied] = useState(false);

  // Generic handler factory for text input fields (Input and Textarea)
  const handleInputChange = useCallback(
    (field: keyof PromptData) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setPromptData((prev) => ({ ...prev, [field]: e.target.value }));
      },
    [], // Dependencies: none, this factory function is stable
  );

  // Handler specifically for the category select, managing custom category logic
  const handleCategoryChange = useCallback((value: CategoryValue) => {
    setPromptData((prev) => ({
      ...prev,
      category: value,
      // Clear custom category if a standard category is selected
      customCategory: value !== 'custom' ? '' : prev.customCategory,
    }));
  }, []); // Dependencies: none, this function is stable

  // Handler to generate the prompt using the utility function
  const generatePrompt = useCallback(() => {
    // Validation: Ensure the 'Request' field is not empty
    if (!promptData.request.trim()) {
      toast.warning("The 'Request' field is required to generate a prompt.");
      return;
    }
    // Validation: Ensure 'Custom Category' is not empty if 'Custom' is selected
    if (promptData.category === 'custom' && !promptData.customCategory.trim()) {
      toast.warning("Please enter a value for the 'Custom Category'.");
      return;
    }

    try {
      // Pass the current prompt data to the utility function
      const generated = generatePromptUtility(promptData);
      setOutput(generated);
      toast.success('Prompt generated successfully!');
    } catch (error) {
      // Log and display user-friendly error message
      console.error('Error generating prompt:', error);
      if (error instanceof Error) {
        toast.error(`Error generating prompt: ${error.message}`);
      } else {
        toast.error(
          'An unexpected error occurred while generating the prompt.',
        );
      }
      setOutput(''); // Clear previous output on error
    }
  }, [promptData]); // Dependencies: promptData state

  // Handler to copy the generated output to the clipboard
  const copyToClipboard = useCallback(async () => {
    // Only attempt to copy if there is output
    if (!output) return;

    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      toast.success('Prompt copied to clipboard!');
      // Reset copied state after 2 seconds
      const timer = setTimeout(() => setCopied(false), 2000);
      // Clear timeout if component unmounts or output changes before timeout finishes
      return () => clearTimeout(timer);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast.error('Failed to copy prompt to clipboard.');
      setCopied(false); // Ensure state is not stuck if copy fails
    }
  }, [output]); // Dependencies: output state

  // Determine if the custom category input should be shown
  const showCustomCategory = useMemo(
    () => promptData.category === 'custom',
    [promptData.category],
  );

  // Determine if the copy button should be disabled
  const isCopyDisabled = !output || copied;

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background text-foreground">
      <div className="max-w-4xl mx-auto space-y-6">
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
                <Label htmlFor="category">Category</Label>
                <Select
                  value={promptData.category}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger
                    id="category"
                    className="bg-background border-border"
                  >
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Category Input (conditionally rendered) */}
              {showCustomCategory && (
                <div className="space-y-2">
                  <Label htmlFor="customCategory">Custom Category</Label>
                  <Input
                    id="customCategory"
                    placeholder="Enter your custom category"
                    value={promptData.customCategory}
                    onChange={handleInputChange('customCategory')}
                    className="bg-background border-border"
                    required // HTML5 required attribute for custom category when shown
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
              />
            </div>

            {/* Request Textarea (required) */}
            <div className="space-y-2">
              <Label htmlFor="request">Request *</Label>
              <Textarea
                id="request"
                placeholder="Clearly describe what you need help with..."
                value={promptData.request}
                onChange={handleInputChange('request')}
                rows={3}
                required // HTML5 required attribute
                className="bg-background border-border"
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
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4">
              <Button
                onClick={generatePrompt}
                className="w-full md:w-auto"
                aria-label="Generate prompt"
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Prompt
              </Button>
              {/* WesAI Code Assistant Button/Link */}
              <Link
                href="https://wesai.netlify.app/"
                target="_blank"
                rel="noopener noreferrer" // Security best practice for target="_blank"
                // Apply Shadcn button styles using tailwind classes
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-9 px-4 py-2 w-full md:w-auto"
                aria-label="Open WesAI Code Assistant" // Added aria-label
              >
                WesAI Code Assistant
                <ExternalLink className="ml-2 h-4 w-4" />{' '}
                {/* External link icon */}
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Output Card (conditionally rendered) */}
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
                disabled={isCopyDisabled}
                aria-label="Copy to clipboard" // Added aria-label
              >
                <Copy className="mr-2 h-4 w-4" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </CardHeader>
            <CardContent>
              {/* Output Display Area */}
              <div className="bg-muted p-4 rounded-md font-mono text-sm overflow-y-auto max-h-[300px]">
                {' '}
                {/* Improved styling and added scroll/max-height */}
                <pre className="whitespace-pre-wrap text-muted-foreground">
                  {' '}
                  {/* Used muted-foreground for text color */}
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
