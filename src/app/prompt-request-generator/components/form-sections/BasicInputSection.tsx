import React from 'react';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PromptData } from '@/lib/prompt-generator/types';
import CharacterCounter from '../CharacterCounter';

interface BasicInputSectionProps {
  control: Control<PromptData>;
  errors: FieldErrors<PromptData>;
  handleFieldChange: (field: keyof PromptData, value: string) => void;
  requestInputRef?: React.RefObject<HTMLTextAreaElement | null>;
  contextInputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

const ERROR_BORDER_CLASS = 'border-red-500';

export const BasicInputSection: React.FC<BasicInputSectionProps> = ({
  control,
  errors,
  handleFieldChange,
  requestInputRef,
  contextInputRef,
}) => {
  return (
    <div className="space-y-6">
      {/* Request Textarea */}
      <Controller
        name="request"
        control={control}
        rules={{ required: 'The Request field is required.' }}
        render={({ field }) => (
          <div className="space-y-2 relative">
            <Label htmlFor="request">
              Request <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Textarea
                id="request"
                placeholder="Clearly describe what you need help with..."
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  handleFieldChange('request', e.target.value);
                }}
                rows={6}
                className={`bg-background border-border font-mono pr-12 ${errors.request ? ERROR_BORDER_CLASS : ''}`}
                aria-required={true}
                aria-invalid={!!errors.request}
                ref={requestInputRef}
              />
              <div className="absolute bottom-2 right-2 opacity-50 text-[10px]">
                <CharacterCounter
                  current={field.value?.length || 0}
                  max={1000}
                />
              </div>
            </div>
            {errors.request && (
              <p className="text-red-500 text-sm mt-1" role="alert">
                {errors.request.message}
              </p>
            )}
          </div>
        )}
      />

      {/* Context Textarea */}
      <Controller
        name="context"
        control={control}
        render={({ field }) => (
          <div className="space-y-2 relative">
            <Label htmlFor="context">Context (optional)</Label>
            <div className="relative">
              <Textarea
                id="context"
                placeholder="Provide background information about your project or problem..."
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  handleFieldChange('context', e.target.value);
                }}
                rows={4}
                className="bg-background border-border font-mono resize-none pr-12"
                ref={contextInputRef}
              />
              <div className="absolute bottom-2 right-2 opacity-50 text-[10px]">
                <CharacterCounter
                  current={field.value?.length || 0}
                  max={2000}
                />
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
};
