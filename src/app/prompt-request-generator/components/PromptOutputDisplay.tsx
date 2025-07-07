import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { components } from '@/components/MdxRenderer';

interface PromptOutputDisplayProps {
  output: string;
  copied: boolean;
  isCopyDisabled: boolean;
  copyToClipboard: () => void;
}

const PromptOutputDisplay: React.FC<PromptOutputDisplayProps> = ({
  output,
  copied,
  isCopyDisabled,
  copyToClipboard,
}) => {
  if (!output) return null;

  return (
    <Card className="bg-card border-border mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-foreground">Generated Prompt</CardTitle>
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
          aria-label="Copy generated prompt to clipboard"
        >
          <Copy className="mr-2 h-4 w-4" />
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </CardHeader>
      <CardContent>
        {/* Output Display Area */}
        <div className="bg-muted p-4 rounded-md font-mono text-sm overflow-y-auto max-h-[300px]">
          <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
            {output}
          </ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
};

export default PromptOutputDisplay;
