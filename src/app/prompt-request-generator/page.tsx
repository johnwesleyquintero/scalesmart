'use client';

import { useForm } from 'react-hook-form';
import { usePromptGenerator } from '@/hooks/use-prompt-generator';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { PromptData } from '@/lib/prompt-generator/types';
import { CUSTOM_CATEGORY_VALUE } from '@/lib/prompt-generator/constants';

// Import new components
import PromptInputForm from './components/PromptInputForm';
import SavedRequestsDropdown from './components/SavedRequestsDropdown';
import SaveRequestDialog from './components/SaveRequestDialog';
import PromptActionButtons from './components/PromptActionButtons';
import PromptOutputDisplay from './components/PromptOutputDisplay';

// Import types from the new types file
import { SavedRequest, PromptDataKey } from './components/types';

const ERROR_BORDER_CLASS = 'border-red-500';

/**
 * A component for generating structured prompts based on user input for code assistance.
 * Allows selecting a category, providing context, describing the request, and including code snippets.
 */
export default function PromptRequestGenerator() {
  const {
    promptData,
    setPromptData,
    clearForm,
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
    output,
    setOutput,
    copied,
    setCopied,
    loading,
    setLoading,
    aiLoading,
    setAiLoading,
    showSaveDialog,
    setShowSaveDialog,
    newRequestName,
    setNewRequestName,
    selectedSavedRequestId,
    setSelectedSavedRequestId,
    validationErrors,
    setValidationErrors,
    savedRequests,
    setSavedRequests,
    debouncedUpdatePromptData,
    handleCategoryChange,
    showCustomCategory,
    isGenerateDisabled,
    generatePromptHandler,
    generateAiPromptHandler,
    copyToClipboard,
    handleSaveRequest,
    confirmSaveRequest,
    handleLoadRequest,
    handleDeleteRequest,
    isCopyDisabled,
  } = usePromptGenerator();

  const form = useForm<PromptData>({
    defaultValues: promptData,
  });

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-card p-6 rounded-lg shadow-xl border border-border/50">
        {/* Header Section */}
        <div className="text-center mb-10 space-y-3">
          <h1 className="text-4xl font-extrabold text-foreground sm:text-5xl leading-tight">
            Prompt Request Generator
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create structured prompts for any assistance requests to streamline
            your workflow.
          </p>
          {/* Added WesAI Code Assistant link alongside Personal Assistant link */}
          <p className="text-sm text-muted-foreground mt-4 flex flex-wrap justify-center items-center gap-x-4 gap-y-2">
            Check our new AI assistants:
            <Link
              href="https://wesai-pa.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline inline-flex items-center font-medium"
            >
              WesAI Personal Assistant
              <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
            <Link
              href="https://wesai.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline inline-flex items-center font-medium"
              aria-label="Open WesAI Code Assistant in a new tab"
            >
              WesAI Code Assistant
              <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </p>
        </div>
        {/* Split Panel Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {/* Left Column: Input Form and Controls */}
          <div className="space-y-6">
            <Card className="bg-card border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Request Details
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Fill in the sections below to generate a well-structured
                  prompt
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <PromptInputForm
                  form={form}
                  promptData={promptData}
                  handleCategoryChange={handleCategoryChange}
                  showCustomCategory={showCustomCategory}
                />
                <SavedRequestsDropdown
                  savedRequests={savedRequests}
                  selectedSavedRequestId={selectedSavedRequestId}
                  handleLoadRequest={handleLoadRequest}
                  handleDeleteRequest={handleDeleteRequest}
                />
                <PromptActionButtons
                  isGenerateDisabled={isGenerateDisabled}
                  loading={loading}
                  aiLoading={aiLoading}
                  generatePromptHandler={generatePromptHandler}
                  generateAiPromptHandler={generateAiPromptHandler}
                  handleSaveRequest={handleSaveRequest}
                  requestInput={requestInput}
                  clearForm={clearForm}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Output Display */}
          <div className="space-y-6">
            <Card className="bg-card border-border shadow-sm h-full">
              {' '}
              {/* Use h-full to make card fill height */}
              <CardHeader>
                <CardTitle className="text-foreground">
                  Generated Prompt
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Review and copy the generated prompt
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(100%-theme(spacing.20))] overflow-y-auto p-6">
                {' '}
                {/* Adjust height and add scroll */}
                <PromptOutputDisplay
                  output={output}
                  copied={copied}
                  isCopyDisabled={isCopyDisabled}
                  copyToClipboard={copyToClipboard}
                />
              </CardContent>
            </Card>
          </div>
        </div>
        <SaveRequestDialog
          showSaveDialog={showSaveDialog}
          setShowSaveDialog={setShowSaveDialog}
          newRequestName={newRequestName}
          setNewRequestName={setNewRequestName}
          confirmSaveRequest={confirmSaveRequest}
        />
      </div>
    </div>
  );
}
