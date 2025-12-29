import React from 'react';
import { Controller, Control } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { PromptData } from '@/lib/prompt-generator/types';
import CharacterCounter from '../CharacterCounter';

interface AdvancedConfigSectionProps {
  control: Control<PromptData>;
  handleFieldChange: (field: keyof PromptData, value: string) => void;
  codeInputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export const AdvancedConfigSection: React.FC<AdvancedConfigSectionProps> = ({
  control,
  handleFieldChange,
  codeInputRef,
}) => {
  return (
    <Accordion
      type="multiple"
      className="w-full border rounded-lg overflow-hidden border-border/50"
    >
      <AccordionItem value="advanced-configuration" className="border-none">
        <AccordionTrigger className="hover:no-underline px-4 py-2 text-sm font-semibold bg-muted/30">
          Advanced Prompt Configuration
        </AccordionTrigger>
        <AccordionContent className="p-4 space-y-6 bg-background">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Parent Task Input */}
            <Controller
              name="parentTask"
              control={control}
              render={({ field }) => (
                <div className="space-y-2 relative">
                  <Label htmlFor="parentTask">Parent Task (optional)</Label>
                  <div className="relative">
                    <Input
                      id="parentTask"
                      placeholder="e.g., Annual Marketing Campaign"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange('parentTask', e.target.value);
                      }}
                      className="bg-background border-border font-mono pr-12"
                    />
                    <div className="absolute inset-y-0 right-2 flex items-center opacity-50 text-[10px]">
                      <CharacterCounter
                        current={field.value?.length || 0}
                        max={200}
                      />
                    </div>
                  </div>
                </div>
              )}
            />

            {/* Subtask Input */}
            <Controller
              name="subtask"
              control={control}
              render={({ field }) => (
                <div className="space-y-2 relative">
                  <Label htmlFor="subtask">Subtask (optional)</Label>
                  <div className="relative">
                    <Input
                      id="subtask"
                      placeholder="e.g., Q1 Social Media Strategy"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange('subtask', e.target.value);
                      }}
                      className="bg-background border-border font-mono pr-12"
                    />
                    <div className="absolute inset-y-0 right-2 flex items-center opacity-50 text-[10px]">
                      <CharacterCounter
                        current={field.value?.length || 0}
                        max={150}
                      />
                    </div>
                  </div>
                </div>
              )}
            />
          </div>

          {/* Code Input Editor */}
          <Controller
            name="codeInput"
            control={control}
            render={({ field }) => (
              <div className="space-y-2 relative">
                <Label htmlFor="codeInput">
                  Relevant Data / Code (optional)
                </Label>
                <div className="relative">
                  <Textarea
                    id="codeInput"
                    placeholder="Paste relevant code snippets, data structures, or logs here..."
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handleFieldChange('codeInput', e.target.value);
                    }}
                    rows={8}
                    className="bg-background border-border font-mono resize-none pr-12"
                    ref={codeInputRef}
                  />
                  <div className="absolute bottom-2 right-2 opacity-50 text-[10px]">
                    <CharacterCounter
                      current={field.value?.length || 0}
                      max={5000}
                    />
                  </div>
                </div>
              </div>
            )}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
