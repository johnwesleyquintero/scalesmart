import { Clipboard, ClipboardCheck } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';

interface CopyMarkdownButtonProps {
  content: string;
  type?: 'markdown' | 'code';
  language?: string; // Add language prop
}

const CopyMarkdownButton: React.FC<CopyMarkdownButtonProps> = ({
  content,
  type = 'markdown',
  language, // Destructure language
}) => {
  const [copied, setCopied] = React.useState(false);

  const DEFAULT_LABEL =
    type === 'code' ? `Copy ${language || 'code'}` : 'Copy as Markdown';
  const COPIED_LABEL = 'Copied!';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Optionally, show an error toast/message to the user
    }
  };

  return (
    <Button
      onClick={handleCopy}
      variant="ghost"
      size="icon"
      className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      aria-label={copied ? COPIED_LABEL : DEFAULT_LABEL}
      title={copied ? COPIED_LABEL : DEFAULT_LABEL}
    >
      {copied ? (
        <ClipboardCheck className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <Clipboard className="w-3.5 h-3.5" />
      )}
    </Button>
  );
};

export default CopyMarkdownButton;
