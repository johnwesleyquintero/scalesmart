import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CATEGORIES,
  CUSTOM_CATEGORY_VALUE,
} from '@/lib/prompt-generator/constants';
import { CategoryValue, PromptData } from '@/lib/prompt-generator/types';
import { PromptDataKey } from './types'; // Import from new types file

const ERROR_BORDER_CLASS = 'border-red-500';

interface PromptInputFormProps {
  promptData: PromptData;
  contextInput: string;
  setContextInput: React.Dispatch<React.SetStateAction<string>>;
  requestInput: string;
  setRequestInput: React.Dispatch<React.SetStateAction<string>>;
  parentTaskInput: string;
  setParentTaskInput: React.Dispatch<React.SetStateAction<string>>;
  subtaskInput: string;
  setSubtaskInput: React.Dispatch<React.SetStateAction<string>>;
  codeInput: string;
  setCodeInput: React.Dispatch<React.SetStateAction<string>>;
  customCategoryInput: string;
  setCustomCategoryInput: React.Dispatch<React.SetStateAction<string>>;
  debouncedUpdatePromptData: (field: PromptDataKey, value: string) => void;
  handleCategoryChange: (value: CategoryValue) => void;
  showCustomCategory: boolean;
  validationErrors: Partial<Record<keyof PromptData, string>>;
}

const PromptInputForm: React.FC<PromptInputFormProps> = ({
  promptData,
  contextInput,
  setContextInput,
  requestInput,
  setRequestInput,
  parentTaskInput,
  setParentTaskInput,
  subtaskInput,
  setSubtaskInput,
  codeInput,
  setCodeInput,
  customCategoryInput,
  setCustomCategoryInput,
  debouncedUpdatePromptData,
  handleCategoryChange,
  showCustomCategory,
  validationErrors,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Select */}
        <div className="space-y-2">
          <Label htmlFor="category">
            Category <span className="text-red-500">*</span>
          </Label>
          <Select<CategoryValue>
            value={promptData.category}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger
              id="category"
              className={`bg-background border-border ${validationErrors.category ? ERROR_BORDER_CLASS : ''}`}
              aria-required="true"
              aria-invalid={!!validationErrors.category}
              aria-describedby={
                validationErrors.category ? 'category-error' : undefined
              }
            >
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              {CATEGORIES.map((category) => (
                <SelectItem key={category} value={category} label={category}>
                  {category}
                </SelectItem>
              ))}
              <SelectItem value={CUSTOM_CATEGORY_VALUE} label="Custom">
                Custom
              </SelectItem>
            </SelectContent>
          </Select>
          {validationErrors.category && (
            <p id="category-error" className="text-red-500 text-sm mt-1">
              {validationErrors.category}
            </p>
          )}
        </div>

        {/* Custom Category Input (conditionally rendered) */}
        {showCustomCategory && (
          <div className="space-y-2">
            <Label htmlFor="customCategory">
              Custom Category <span className="text-red-500">*</span>
            </Label>
            <Input
              id="customCategory"
              placeholder="e.g., AI Agent Development"
              value={customCategoryInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setCustomCategoryInput(e.target.value);
                debouncedUpdatePromptData('customCategory', e.target.value);
              }}
              className={`bg-background border-border ${validationErrors.customCategory ? ERROR_BORDER_CLASS : ''}`}
              aria-required={showCustomCategory}
              aria-invalid={!!validationErrors.customCategory}
              aria-describedby={
                validationErrors.customCategory
                  ? 'custom-category-error'
                  : undefined
              }
            />
            {validationErrors.customCategory && (
              <p
                id="custom-category-error"
                className="text-red-500 text-sm mt-1"
              >
                {validationErrors.customCategory}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Context Textarea */}
      <div className="space-y-2">
        <Label htmlFor="context">Context (optional)</Label>
        <Textarea
          id="context"
          placeholder="Provide background information about your project or problem..."
          value={contextInput}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setContextInput(e.target.value);
            debouncedUpdatePromptData('context', e.target.value);
          }}
          rows={3}
          className="bg-background border-border font-mono"
          aria-label="Context for the request (optional)"
        />
      </div>

      {/* Request Textarea */}
      <div className="space-y-2">
        <Label htmlFor="request">
          Request <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="request"
          placeholder="Clearly describe what you need help with..."
          value={requestInput}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setRequestInput(e.target.value);
            debouncedUpdatePromptData('request', e.target.value);
          }}
          rows={3}
          className={`bg-background border-border font-mono ${validationErrors.request ? ERROR_BORDER_CLASS : ''}`}
          aria-required="true"
          aria-invalid={!!validationErrors.request}
          aria-describedby={
            validationErrors.request ? 'request-error' : undefined
          }
        />
        {validationErrors.request && (
          <p id="request-error" className="text-red-500 text-sm mt-1">
            {validationErrors.request}
          </p>
        )}
      </div>

      {/* Parent Task Input */}
      <div className="space-y-2">
        <Label htmlFor="parentTask">Parent Task (optional)</Label>
        <Input
          id="parentTask"
          placeholder="e.g., Implement user authentication"
          value={parentTaskInput}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setParentTaskInput(e.target.value);
            debouncedUpdatePromptData('parentTask', e.target.value);
          }}
          className="bg-background border-border font-mono"
          aria-label="Parent task for the request (optional)"
        />
      </div>

      {/* Subtask Input */}
      <div className="space-y-2">
        <Label htmlFor="subtask">Subtask (optional)</Label>
        <Input
          id="subtask"
          placeholder="e.g., Create login form UI"
          value={subtaskInput}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setSubtaskInput(e.target.value);
            debouncedUpdatePromptData('subtask', e.target.value);
          }}
          className="bg-background border-border font-mono"
          aria-label="Subtask for the request (optional)"
        />
      </div>

      {/* Code Input Textarea */}
      <div className="space-y-2">
        <Label htmlFor="codeInput">Relevant Data (optional)</Label>
        <Textarea
          id="codeInput"
          placeholder="Paste any relevant data (code, CSV, JSON, logs, markdown, etc.)..."
          value={codeInput}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setCodeInput(e.target.value);
            debouncedUpdatePromptData('codeInput', e.target.value);
          }}
          rows={5}
          className="bg-background border-border font-mono"
          aria-label="Relevant code snippet (optional)"
        />
      </div>
    </div>
  );
};

export default PromptInputForm;
