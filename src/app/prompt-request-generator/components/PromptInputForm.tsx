import React, { useEffect } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
import { useForm, Controller, UseFormReturn } from 'react-hook-form';

const ERROR_BORDER_CLASS = 'border-red-500';

// Define the form values type based on PromptData
type PromptFormValues = PromptData;

interface PromptInputFormProps {
  form: UseFormReturn<PromptFormValues>;
  promptData: PromptData;
  handleFieldChange: (field: keyof PromptData, value: string) => void;
  handleCategoryChange: (value: CategoryValue) => void;
  showCustomCategory: boolean;
  requestInputRef?: React.RefObject<HTMLTextAreaElement>;
  contextInputRef?: React.RefObject<HTMLTextAreaElement>;
  codeInputRef?: React.RefObject<HTMLTextAreaElement>;
}

const PromptInputForm: React.FC<PromptInputFormProps> = ({
  form,
  promptData,
  handleFieldChange,
  handleCategoryChange,
  showCustomCategory,
  requestInputRef,
  contextInputRef,
  codeInputRef,
}) => {
  const {
    control,
    formState: { errors },
    setValue,
  } = form;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Select */}
        <Controller
          name="category"
          control={control}
          rules={{ required: 'Please select a Category.' }}
          render={({ field }) => (
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select<CategoryValue>
                value={field.value as CategoryValue}
                onValueChange={(value) => {
                  field.onChange(value); // Update react-hook-form state
                  handleCategoryChange(value); // Trigger custom category logic in hook
                }}
              >
                <SelectTrigger
                  id="category"
                  className={`bg-background border-border ${errors.category ? ERROR_BORDER_CLASS : ''}`}
                  aria-required="true"
                  aria-invalid={!!errors.category}
                  aria-describedby={
                    errors.category ? 'category-error' : undefined
                  }
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {CATEGORIES.map((category) => (
                    <SelectItem
                      key={category}
                      value={category}
                      label={category}
                    >
                      {category}
                    </SelectItem>
                  ))}
                  <SelectItem value={CUSTOM_CATEGORY_VALUE} label="Custom">
                    Custom
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.category && (
                <p
                  id="category-error"
                  className="text-red-500 text-sm mt-1"
                  role="alert"
                >
                  {errors.category.message}
                </p>
              )}
            </div>
          )}
        />

        {/* Custom Category Input (conditionally rendered) */}
        {showCustomCategory && (
          <Controller
            name="customCategory"
            control={control}
            rules={{
              required: 'Please enter a value for the Custom Category.',
            }}
            render={({ field }) => (
              <div className="space-y-2">
                <Label htmlFor="customCategory">
                  Custom Category <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customCategory"
                  placeholder="e.g., AI Agent Development"
                  {...field} // Binds input to react-hook-form
                  onChange={(e) => {
                    field.onChange(e);
                    handleFieldChange('customCategory', e.target.value);
                  }}
                  className={`bg-background border-border ${errors.customCategory ? ERROR_BORDER_CLASS : ''}`}
                  aria-required={showCustomCategory}
                  aria-invalid={!!errors.customCategory}
                  aria-describedby={
                    errors.customCategory ? 'custom-category-error' : undefined
                  }
                />
                {errors.customCategory && (
                  <p
                    id="custom-category-error"
                    className="text-red-500 text-sm mt-1"
                    role="alert"
                  >
                    {errors.customCategory.message}
                  </p>
                )}
              </div>
            )}
          />
        )}
      </div>

      {/* Context Textarea */}
      <Controller
        name="context"
        control={control}
        render={({ field }) => (
          <div className="space-y-2">
            <Label htmlFor="context">Context (optional)</Label>
            <Textarea
              id="context"
              placeholder="Provide background information about your project or problem..."
              {...field} // Binds textarea to react-hook-form
              onChange={(e) => {
                field.onChange(e);
                handleFieldChange('context', e.target.value);
              }}
              rows={3}
              className="bg-background border-border font-mono"
              aria-label="Context for the request (optional)"
              ref={contextInputRef}
            />
          </div>
        )}
      />

      {/* Request Textarea */}
      <Controller
        name="request"
        control={control}
        rules={{ required: 'The Request field is required.' }}
        render={({ field }) => (
          <div className="space-y-2">
            <Label htmlFor="request">
              Request <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="request"
              placeholder="Clearly describe what you need help with..."
              {...field} // Binds textarea to react-hook-form
              onChange={(e) => {
                field.onChange(e);
                handleFieldChange('request', e.target.value);
              }}
              rows={3}
              className={`bg-background border-border font-mono ${errors.request ? ERROR_BORDER_CLASS : ''}`}
              aria-required="true"
              aria-invalid={!!errors.request}
              aria-describedby={errors.request ? 'request-error' : undefined}
              ref={requestInputRef}
            />
            {errors.request && (
              <p
                id="request-error"
                className="text-red-500 text-sm mt-1"
                role="alert"
              >
                {errors.request.message}
              </p>
            )}
          </div>
        )}
      />

      <Accordion type="multiple" className="w-full">
        <AccordionItem value="advanced-options">
          <AccordionTrigger className="hover:no-underline text-base font-semibold">
            Advanced Options (Optional Fields)
          </AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            {/* Parent Task Input */}
            <Controller
              name="parentTask"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="parentTask">Parent Task (optional)</Label>
                  <Input
                    id="parentTask"
                    placeholder="e.g., Implement user authentication"
                    {...field} // Binds input to react-hook-form
                    onChange={(e) => {
                      field.onChange(e);
                      handleFieldChange('parentTask', e.target.value);
                    }}
                    className="bg-background border-border font-mono"
                    aria-label="Parent task for the request (optional)"
                  />
                </div>
              )}
            />

            {/* Subtask Input */}
            <Controller
              name="subtask"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="subtask">Subtask (optional)</Label>
                  <Input
                    id="subtask"
                    placeholder="e.g., Create login form UI"
                    {...field} // Binds input to react-hook-form
                    onChange={(e) => {
                      field.onChange(e);
                      handleFieldChange('subtask', e.target.value);
                    }}
                    className="bg-background border-border font-mono"
                    aria-label="Subtask for the request (optional)"
                  />
                </div>
              )}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Code Input Editor */}
      <Controller
        name="codeInput"
        control={control}
        render={({ field }) => (
          <div className="space-y-2">
            <Label htmlFor="codeInput">Relevant Data (optional)</Label>
            <div className="relative border border-input rounded-md bg-background font-mono text-sm overflow-hidden shadow-sm [&>div]:!p-0">
              <Editor
                value={field.value || ''}
                onValueChange={(code) => {
                  field.onChange(code);
                  handleFieldChange('codeInput', code);
                }}
                highlight={(code) =>
                  highlight(code, languages.javascript, 'javascript')
                }
                padding={12}
                textareaClassName="focus:outline-none min-h-[200px]"
                preClassName="p-3"
                aria-label="Relevant code or data (optional)"
              />
            </div>
          </div>
        )}
      />
    </div>
  );
};

export default PromptInputForm;
