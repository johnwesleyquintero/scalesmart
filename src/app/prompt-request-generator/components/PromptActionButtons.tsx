import React from 'react';
import { Button } from '@/components/ui/button';
import { Wand2, Save } from 'lucide-react';
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
  const baseButtonClass = 'w-full sm:w-auto rounded-md py-2 px-4'; //Added base class for consistency

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-4">
      {/* Generate Prompt Button */}
      <Button
        onClick={generatePromptHandler}
        className={`${baseButtonClass}`}
        aria-label="Generate prompt based on details"
        disabled={isGenerateDisabled || loading || aiLoading}
      >
        {loading ? (
          'Generating...'
        ) : (
          <>
            <Wand2 className="mr-2 h-4 w-4 inline-block" />
            Generate Prompt
          </>
        )}
      </Button>

      {/* Generate AI Prompt Button */}
      <Button
        onClick={generateAiPromptHandler}
        disabled={isGenerateDisabled || aiLoading || loading}
        className={`${baseButtonClass} bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white`}
        aria-label="Generate prompt using AI (Gemini)"
      >
        {aiLoading ? (
          'Generating with AI...'
        ) : (
          <>
            <Wand2 className="mr-2 h-4 w-4 inline-block" />
            Generate with AI
          </>
        )}
      </Button>

      {/* Save Request Button */}
      <Button
        variant="outline"
        onClick={handleSaveRequest}
        className={`${baseButtonClass}`}
        aria-label="Save current request to local storage"
        disabled={!requestInput.trim()}
      >
        <Save className="mr-2 h-4 w-4 inline-block" />
        Save Request
      </Button>

      {/* Clear Form Button */}
      <Button
        variant="outline"
        onClick={clearForm}
        className={`${baseButtonClass}`}
        aria-label="Clear all form fields"
      >
        Clear Form
      </Button>
    </div>
  );
};

export default PromptActionButtons;
