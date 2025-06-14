import { Clipboard, ClipboardCheck } from 'lucide-react';
import React from 'react';

interface CopyMarkdownButtonProps {
  content: string;
  type?: 'markdown' | 'code';
}

const CopyMarkdownButton: React.FC<CopyMarkdownButtonProps> = ({
  content,
  type = 'markdown',
}) => {
  const [copied, setCopied] = React.useState(false);

  const DEFAULT_LABEL = type === 'code' ? 'Copy code' : 'Copy as Markdown';
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
    <button
      onClick={handleCopy}
      className="absolute top-1 right-1 p-1.5 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
      aria-label={copied ? COPIED_LABEL : DEFAULT_LABEL}
      title={copied ? COPIED_LABEL : DEFAULT_LABEL}
    >
      {copied ? (
        <ClipboardCheck className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <Clipboard className="w-3.5 h-3.5" />
      )}
    </button>
  );
};

export default CopyMarkdownButton;
