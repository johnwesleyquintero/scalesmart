import React, { useEffect } from 'react';
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
import CharacterCounter from './CharacterCounter';
import { PromptTemplate, PROMPT_TEMPLATES } from './PromptTemplateSelector';
import { Button } from '@/components/ui/button';
import { Wand2, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ERROR_BORDER_CLASS = 'border-red-500';

// Define the form values type based on PromptData
type PromptFormValues = PromptData;

interface PromptInputFormProps {
  form: UseFormReturn<PromptFormValues>;
  promptData: PromptData;
  handleFieldChange: (field: keyof PromptData, value: string) => void;
  handleCategoryChange: (value: CategoryValue) => void;
  showCustomCategory: boolean;
  onSelectTemplate: (template: PromptTemplate) => void;
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
  onSelectTemplate,
  requestInputRef,
  contextInputRef,
  codeInputRef,
}) => {
  const {
    control,
    formState: { errors },
    setValue,
    watch,
  } = form;

  const selectedCategoryValue = watch('category');

  const filteredTemplates = PROMPT_TEMPLATES.filter(
    (t) => t.category === selectedCategoryValue,
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Select */}
        <Controller
          name="category"
          control={control}
          rules={{ required: 'Please select a Category.' }}
          render={({ field }) => (
            <div className="space-y-2">
              <Label
                htmlFor="category"
                className="flex justify-between items-center"
              >
                <span>
                  Category <span className="text-red-500">*</span>
                </span>
                {selectedCategoryValue && filteredTemplates.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      >
                        <Wand2 className="w-3 h-3" />
                        Use Template
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {filteredTemplates.map((template) => (
                        <DropdownMenuItem
                          key={template.id}
                          onClick={() => onSelectTemplate(template)}
                          className="text-xs"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium">{template.name}</span>
                            <span className="text-[10px] text-muted-foreground line-clamp-1">
                              {template.description}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
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
                  placeholder="e.g., Business Strategy"
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
                {...field} // Binds textarea to react-hook-form
                onChange={(e) => {
                  field.onChange(e);
                  handleFieldChange('request', e.target.value);
                }}
                rows={6}
                className={`bg-background border-border font-mono pr-12 ${errors.request ? ERROR_BORDER_CLASS : ''}`}
                aria-required="true"
                aria-invalid={!!errors.request}
                aria-describedby={errors.request ? 'request-error' : undefined}
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
                {...field} // Binds textarea to react-hook-form
                onChange={(e) => {
                  field.onChange(e);
                  handleFieldChange('context', e.target.value);
                }}
                rows={4}
                className="bg-background border-border font-mono resize-none pr-12"
                aria-label="Context for the request (optional)"
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
                        {...field} // Binds input to react-hook-form
                        onChange={(e) => {
                          field.onChange(e);
                          handleFieldChange('parentTask', e.target.value);
                        }}
                        className="bg-background border-border font-mono pr-12"
                        aria-label="Parent task for the request (optional)"
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
                        {...field} // Binds input to react-hook-form
                        onChange={(e) => {
                          field.onChange(e);
                          handleFieldChange('subtask', e.target.value);
                        }}
                        className="bg-background border-border font-mono pr-12"
                        aria-label="Subtask for the request (optional)"
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
                      aria-label="Relevant code or data (optional)"
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
    </div>
  );
};

export default PromptInputForm;
