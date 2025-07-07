'use client';

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

  return (
    <div className="container mx-auto p-4">
      <div className="bg-card p-6 rounded-lg shadow-md">
        {' '}
        {/* Main content wrapper */}
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Prompt Request Generator
          </h1>
          <p className="text-muted-foreground mt-2">
            Create structured prompts for any assistance requests
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Check our new AI assistant:
            <Link
              href="https://wesai-pa.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 text-blue-500 hover:underline inline-flex items-center"
            >
              WesAI Personal Assistant
              <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </p>
        </div>
        <div className="space-y-6">
          {' '}
          {/* Wrapper for input and output cards */}
          {/* Input Card */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Request Details</CardTitle>
              <CardDescription className="text-muted-foreground">
                Fill in the sections below to generate a well-structured prompt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PromptInputForm
                  promptData={promptData}
                  contextInput={contextInput}
                  setContextInput={setContextInput}
                  requestInput={requestInput}
                  setRequestInput={setRequestInput}
                  parentTaskInput={parentTaskInput}
                  setParentTaskInput={setParentTaskInput}
                  subtaskInput={subtaskInput}
                  setSubtaskInput={setSubtaskInput}
                  codeInput={codeInput}
                  setCodeInput={setCodeInput}
                  customCategoryInput={customCategoryInput}
                  setCustomCategoryInput={setCustomCategoryInput}
                  debouncedUpdatePromptData={debouncedUpdatePromptData}
                  handleCategoryChange={handleCategoryChange}
                  showCustomCategory={showCustomCategory}
                  validationErrors={validationErrors}
                />
                <SavedRequestsDropdown
                  savedRequests={savedRequests}
                  selectedSavedRequestId={selectedSavedRequestId}
                  handleLoadRequest={handleLoadRequest}
                  handleDeleteRequest={handleDeleteRequest}
                />
              </div>

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
          <PromptOutputDisplay
            output={output}
            copied={copied}
            isCopyDisabled={isCopyDisabled}
            copyToClipboard={copyToClipboard}
          />
          <SaveRequestDialog
            showSaveDialog={showSaveDialog}
            setShowSaveDialog={setShowSaveDialog}
            newRequestName={newRequestName}
            setNewRequestName={setNewRequestName}
            confirmSaveRequest={confirmSaveRequest}
          />
        </div>
      </div>
    </div>
  );
}
