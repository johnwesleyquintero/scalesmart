import React from 'react';
import { Button } from '@/components/ui/button';
import { Wand2, Save, Undo2, Redo2 } from 'lucide-react';
import Link from 'next/link';
import LoadingSpinner from './LoadingSpinner';

interface PromptActionButtonsProps {
  isGenerateDisabled: boolean;
  loading: boolean;
  aiLoading: boolean;
  generatePromptHandler: () => void;
  generateAiPromptHandler: () => void;
  handleSaveRequest: () => void;
  requestInput: string;
  clearForm: () => void;
  aiModel?: string;
  temperature?: number;
  undo?: () => void;
  redo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
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
  aiModel,
  temperature,
  undo,
  redo,
  canUndo,
  canRedo,
}) => {
  const baseButtonClass = 'w-full sm:w-auto rounded-md py-2 px-4'; //Added base class for consistency

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-4">
      {/* Undo/Redo Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={undo}
          className="px-3 py-2"
          aria-label="Undo last change"
          disabled={!canUndo || loading || aiLoading}
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          onClick={redo}
          className="px-3 py-2"
          aria-label="Redo last undone change"
          disabled={!canRedo || loading || aiLoading}
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Generate Prompt Button */}
      <Button
        onClick={generatePromptHandler}
        className={`${baseButtonClass}`}
        aria-label="Generate prompt based on details"
        disabled={isGenerateDisabled || loading || aiLoading}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <LoadingSpinner size="sm" />
            <span>Generating prompt...</span>
          </div>
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
        className={`${baseButtonClass} bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white relative group`}
        aria-label={`Generate prompt using AI (${aiModel || 'GPT-4 Turbo'})`}
      >
        {aiLoading ? (
          <div className="flex items-center gap-2">
            <LoadingSpinner size="sm" />
            <span>Thinking with AI...</span>
          </div>
        ) : (
          <>
            <Wand2 className="mr-2 h-4 w-4 inline-block" />
            Generate with AI
          </>
        )}
        {aiModel && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            {aiModel} • {temperature || 0.7}°
          </div>
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
