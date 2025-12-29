import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CategoryValue, PromptData } from '@/lib/prompt-generator/types';
import { PromptTemplate } from './PromptTemplateSelector';
import { CategorySection } from './form-sections/CategorySection';
import { BasicInputSection } from './form-sections/BasicInputSection';
import { AdvancedConfigSection } from './form-sections/AdvancedConfigSection';

interface PromptInputFormProps {
  form: UseFormReturn<PromptData>;
  promptData: PromptData;
  handleFieldChange: (field: keyof PromptData, value: string) => void;
  handleCategoryChange: (value: CategoryValue) => void;
  showCustomCategory: boolean;
  onSelectTemplate: (template: PromptTemplate) => void;
  requestInputRef?: React.RefObject<HTMLTextAreaElement | null>;
  contextInputRef?: React.RefObject<HTMLTextAreaElement | null>;
  codeInputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

const PromptInputForm: React.FC<PromptInputFormProps> = ({
  form,
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
    watch,
  } = form;

  const selectedCategoryValue = watch('category');

  return (
    <div className="space-y-6">
      <CategorySection
        control={control}
        errors={errors}
        selectedCategoryValue={selectedCategoryValue}
        showCustomCategory={showCustomCategory}
        handleCategoryChange={handleCategoryChange}
        handleFieldChange={handleFieldChange}
        onSelectTemplate={onSelectTemplate}
      />

      <BasicInputSection
        control={control}
        errors={errors}
        handleFieldChange={handleFieldChange}
        requestInputRef={requestInputRef}
        contextInputRef={contextInputRef}
      />

      <AdvancedConfigSection
        control={control}
        handleFieldChange={handleFieldChange}
        codeInputRef={codeInputRef}
      />
    </div>
  );
};

export default PromptInputForm;
