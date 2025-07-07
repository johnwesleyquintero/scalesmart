import React from 'react';
import { Button } from '@/components/ui/button';
import { Wand2, Save, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface PromptActionButtonsProps {
  isGenerateDisabled: boolean;
  loading: boolean;
  aiLoading: boolean;
  generatePromptHandler: () => void;
  generateAiPromptHandler: () => void;
  handleSaveRequest: () => void;
  requestInput: string;
  clearForm: () => void;
}

const PromptActionButtons: React.FC<PromptActionButtonsProps> = ({
  isGenerateDisabled,
  loading,
  aiLoading,
  generatePromptHandler,
  generateAiPromptHandler,
  handleSaveRequest,
  requestInput,
  clearForm,
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Generate Prompt Button */}
      <Button
        onClick={generatePromptHandler}
        className="w-full md:w-auto"
        aria-label="Generate prompt based on details"
        disabled={isGenerateDisabled || loading || aiLoading}
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
      <Button
        onClick={generateAiPromptHandler}
        disabled={isGenerateDisabled || aiLoading || loading}
        className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white"
        aria-label="Generate prompt using AI (Gemini)"
      >
        {aiLoading ? 'Generating with AI...' : 'Generate with AI (Gemini)'}
      </Button>

      {/* Save Request Button */}
      <Button
        variant="outline"
        onClick={handleSaveRequest}
        className="w-full md:w-auto"
        aria-label="Save current request to local storage"
        disabled={!requestInput.trim()}
      >
        <Save className="mr-2 h-4 w-4" />
        Save Request
      </Button>

      {/* Clear Form Button */}
      <Button
        variant="outline"
        onClick={clearForm}
        className="w-full md:w-auto"
        aria-label="Clear all form fields"
      >
        Clear Form
      </Button>

      {/* Link to External AI Assistant */}
      <Link
        href="https://wesai.netlify.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-9 px-4 py-2 w-full md:w-auto"
        aria-label="Open WesAI Code Assistant in a new tab"
      >
        WesAI Code Assistant
        <ExternalLink className="ml-2 h-4 w-4" />
      </Link>
    </div>
  );
};

export default PromptActionButtons;
