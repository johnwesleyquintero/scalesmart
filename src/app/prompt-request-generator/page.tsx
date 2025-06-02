'use client';

import { useState } from 'react';
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

const CATEGORIES = [
  'Code Refinement',
  'Error Fixing',
  'Code Generation',
  'Code Review',
  'Documentation',
  'Optimization',
  'Debugging',
  'Feature Implementation',
];

export default function PromptRequestGenerator() {
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [context, setContext] = useState('');
  const [request, setRequest] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const generatePrompt = () => {
    let prompt = '';

    // Add category section
    if (category || customCategory) {
      prompt += `### ${customCategory || category}\n\n`;
    }

    // Add context section
    if (context.trim()) {
      prompt += `#### Context\n\n${context}\n\n`;
    }

    // Add request section
    if (request.trim()) {
      prompt += `#### Request\n\n${request}\n\n`;
    }

    // Add code input section
    if (codeInput.trim()) {
      prompt += `#### Code\n\n\`\`\`\n${codeInput}\n\`\`\`\n`;
    }

    setOutput(prompt);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    if (value !== 'custom') {
      setCustomCategory('');
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Prompt Request Generator</h1>
          <p className="text-muted-foreground mt-2">
            Create structured prompts for code assistance requests
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
            <CardDescription>
              Fill in the sections below to generate a well-structured prompt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {category === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="customCategory">Custom Category</Label>
                  <Input
                    id="customCategory"
                    placeholder="Enter your custom category"
                    value={customCategory}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCustomCategory(e.target.value)
                    }
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="context">Context (optional)</Label>
              <Textarea
                id="context"
                placeholder="Provide background information about your project or problem..."
                value={context}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setContext(e.target.value)
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="request">Request *</Label>
              <Textarea
                id="request"
                placeholder="Clearly describe what you need help with..."
                value={request}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setRequest(e.target.value)
                }
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="codeInput">Relevant Code (optional)</Label>
              <Textarea
                id="codeInput"
                placeholder="Paste any relevant code snippets..."
                value={codeInput}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setCodeInput(e.target.value)
                }
                rows={5}
              />
            </div>

            <Button onClick={generatePrompt} className="w-full md:w-auto">
              <Wand2 className="mr-2 h-4 w-4" />
              Generate Prompt
            </Button>
          </CardContent>
        </Card>

        {output && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Generated Prompt</CardTitle>
                <CardDescription>Ready to copy and use</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                disabled={!output}
              >
                <Copy className="mr-2 h-4 w-4" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
                <pre className="whitespace-pre-wrap">{output}</pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
