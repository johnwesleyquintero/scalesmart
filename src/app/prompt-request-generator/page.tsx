'use client';

import { useForm } from 'react-hook-form';
import { usePromptGenerator } from '@/hooks/use-prompt-generator';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Copy, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { PromptData } from '@/lib/prompt-generator/types';

// Import new components
import DeleteConfirmationDialog from './components/DeleteConfirmationDialog';
import PromptInputForm from './components/PromptInputForm';
import SavedRequestsDropdown from './components/SavedRequestsDropdown';
import SaveRequestDialog from './components/SaveRequestDialog';
import PromptActionButtons from './components/PromptActionButtons';
import PromptOutputDisplay from './components/PromptOutputDisplay';

/**
 * A component for generating structured prompts based on user input for code assistance.
 * Allows selecting a category, providing context, describing the request, and including code snippets.
 */
export default function PromptRequestGenerator() {
  const {
    promptData,
    output,
    copied,
    loading,
    aiLoading,
    showSaveDialog,
    newRequestName,
    selectedSavedRequestId,
    savedRequests,
    clearForm,
    handleFieldChange,
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
    setNewRequestName,
    setShowSaveDialog,
    requestPendingDeletion,
    confirmDeleteRequest,
    cancelDeleteRequest,
  } = usePromptGenerator();

  const form = useForm<PromptData>({
    values: promptData,
  });

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 via-transparent to-blue-100/30 dark:from-purple-950/30 dark:via-transparent dark:to-blue-950/30 blur-3xl"></div>
      </div>
      <div className="bg-card p-6 rounded-lg shadow-xl border border-border/50 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-10 space-y-3">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl leading-tight bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
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
        {/* Full-Width Layout */}
        <div className="mt-8 space-y-8">
          {/* Input Form and Controls */}
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Request Details</CardTitle>
              <CardDescription className="text-muted-foreground">
                Fill in the sections below to generate a well-structured prompt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <PromptInputForm
                form={form}
                promptData={promptData}
                handleFieldChange={handleFieldChange}
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
                requestInput={promptData.request}
                clearForm={clearForm}
              />
            </CardContent>
          </Card>

          {/* Output Display */}
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-foreground">
                  Generated Prompt
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Ready to copy and use
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                disabled={isCopyDisabled}
                aria-label="Copy generated prompt to clipboard"
              >
                <Copy className="mr-2 h-4 w-4" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </CardHeader>
            <CardContent>
              <PromptOutputDisplay output={output} />
            </CardContent>
          </Card>
        </div>
        <SaveRequestDialog
          showSaveDialog={showSaveDialog}
          setShowSaveDialog={setShowSaveDialog}
          newRequestName={newRequestName}
          setNewRequestName={setNewRequestName}
          confirmSaveRequest={confirmSaveRequest}
        />
        <DeleteConfirmationDialog
          requestPendingDeletion={requestPendingDeletion}
          onConfirmDelete={confirmDeleteRequest}
          onCancelDelete={cancelDeleteRequest}
        />
      </div>
    </div>
  );
}
