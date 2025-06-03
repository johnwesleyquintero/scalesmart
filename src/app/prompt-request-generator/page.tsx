'use client';

import { useState, useCallback } from 'react';
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
import { Copy, Wand2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner'; // For displaying user feedback

// Import the new modular prompt generation utility
import { generatePrompt as generatePromptUtility } from '@/lib/prompt-generator/promptGenerator';

// Type definitions
interface PromptData {
  category: string;
  customCategory: string;
  context: string;
  request: string;
  codeInput: string;
}

const CATEGORIES = [
  'Code Refinement',
  'Error Fixing',
  'Code Generation',
  'Code Review',
  'Documentation',
  'Optimization',
  'Debugging',
  'Feature Implementation',
] as const;

export default function PromptRequestGenerator() {
  const [promptData, setPromptData] = useState<PromptData>({
    category: '',
    customCategory: '',
    context: '',
    request: '',
    codeInput: '',
  });
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const handleChange = useCallback(
    (field: keyof PromptData) => (value: string) => {
      setPromptData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const generatePrompt = useCallback(() => {
    try {
      const generated = generatePromptUtility(promptData);
      setOutput(generated);
      toast.success('Prompt generated successfully!');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Error generating prompt: ${error.message}`);
      } else {
        toast.error(
          'An unexpected error occurred while generating the prompt.',
        );
      }
      setOutput(''); // Clear output on error
    }
  }, [promptData]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Prompt copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast.error('Failed to copy prompt to clipboard.');
    }
  }, [output]);

  const handleCategoryChange = useCallback((value: string) => {
    setPromptData((prev) => ({
      ...prev,
      category: value,
      customCategory: value !== 'custom' ? '' : prev.customCategory,
    }));
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background text-foreground">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Prompt Request Generator</h1>
          <p className="text-muted-foreground mt-2">
            Create structured prompts for code assistance requests
          </p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
            <CardDescription className="text-muted-foreground">
              Fill in the sections below to generate a well-structured prompt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={promptData.category}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger className="bg-background border-border">
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

              {promptData.category === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="customCategory">Custom Category</Label>
                  <Input
                    id="customCategory"
                    placeholder="Enter your custom category"
                    value={promptData.customCategory}
                    onChange={(e) =>
                      handleChange('customCategory')(e.target.value)
                    }
                    className="bg-background border-border"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="context">Context (optional)</Label>
              <Textarea
                id="context"
                placeholder="Provide background information about your project or problem..."
                value={promptData.context}
                onChange={(e) => handleChange('context')(e.target.value)}
                rows={3}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="request">Request *</Label>
              <Textarea
                id="request"
                placeholder="Clearly describe what you need help with..."
                value={promptData.request}
                onChange={(e) => handleChange('request')(e.target.value)}
                rows={3}
                required
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="codeInput">Relevant Code (optional)</Label>
              <Textarea
                id="codeInput"
                placeholder="Paste any relevant code snippets..."
                value={promptData.codeInput}
                onChange={(e) => handleChange('codeInput')(e.target.value)}
                rows={5}
                className="bg-background border-border font-mono"
              />
            </div>

            <Button
              onClick={generatePrompt}
              className="w-full md:w-auto"
              aria-label="Generate prompt"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Generate Prompt
            </Button>
          </CardContent>
        </Card>

        {output && (
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Generated Prompt</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Ready to copy and use
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                disabled={!output}
                aria-label="Copy to clipboard"
              >
                <Copy className="mr-2 h-4 w-4" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md font-mono text-sm">
                <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
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
