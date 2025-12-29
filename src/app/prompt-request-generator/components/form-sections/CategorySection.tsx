import React from 'react';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Wand2, ChevronDown } from 'lucide-react';
import {
  CATEGORIES,
  CUSTOM_CATEGORY_VALUE,
} from '@/lib/prompt-generator/constants';
import { CategoryValue, PromptData } from '@/lib/prompt-generator/types';
import { PromptTemplate, PROMPT_TEMPLATES } from '../PromptTemplateSelector';

interface CategorySectionProps {
  control: Control<PromptData>;
  errors: FieldErrors<PromptData>;
  selectedCategoryValue: CategoryValue;
  showCustomCategory: boolean;
  handleCategoryChange: (value: CategoryValue) => void;
  handleFieldChange: (field: keyof PromptData, value: string) => void;
  onSelectTemplate: (template: PromptTemplate) => void;
}

const ERROR_BORDER_CLASS = 'border-red-500';

export const CategorySection: React.FC<CategorySectionProps> = ({
  control,
  errors,
  selectedCategoryValue,
  showCustomCategory,
  handleCategoryChange,
  handleFieldChange,
  onSelectTemplate,
}) => {
  const filteredTemplates = PROMPT_TEMPLATES.filter(
    (t) => t.category === selectedCategoryValue,
  );

  return (
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
                field.onChange(value);
                handleCategoryChange(value);
              }}
            >
              <SelectTrigger
                id="category"
                className={`bg-background border-border ${errors.category ? ERROR_BORDER_CLASS : ''}`}
                aria-required="true"
                aria-invalid={!!errors.category}
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
            {errors.category && (
              <p className="text-red-500 text-sm mt-1" role="alert">
                {errors.category.message}
              </p>
            )}
          </div>
        )}
      />

      {/* Custom Category Input */}
      {showCustomCategory && (
        <Controller
          name="customCategory"
          control={control}
          rules={{ required: 'Please enter a value for the Custom Category.' }}
          render={({ field }) => (
            <div className="space-y-2">
              <Label htmlFor="customCategory">
                Custom Category <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customCategory"
                placeholder="e.g., Business Strategy"
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  handleFieldChange('customCategory', e.target.value);
                }}
                className={`bg-background border-border ${errors.customCategory ? ERROR_BORDER_CLASS : ''}`}
                aria-required={showCustomCategory}
                aria-invalid={!!errors.customCategory}
              />
              {errors.customCategory && (
                <p className="text-red-500 text-sm mt-1" role="alert">
                  {errors.customCategory.message}
                </p>
              )}
            </div>
          )}
        />
      )}
    </div>
  );
};
