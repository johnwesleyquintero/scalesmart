'use client';

import { useForm } from 'react-hook-form';
import { usePromptGenerator } from '@/hooks/use-prompt-generator';
import {
  useKeyboardShortcuts,
  PROMPT_GENERATOR_SHORTCUTS,
} from '@/hooks/use-keyboard-shortcuts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Copy,
  ExternalLink,
  Wand2,
  Zap,
  Save,
  Sparkles,
  Keyboard,
} from 'lucide-react';
import Link from 'next/link';
import { PromptData } from '@/lib/prompt-generator/types';
import { useToast } from '@/hooks/use-toast';

// Import new components
import DeleteConfirmationDialog from './components/DeleteConfirmationDialog';
import PromptInputForm from './components/PromptInputForm';
import SavedRequestsDropdown from './components/SavedRequestsDropdown';
import SaveRequestDialog from './components/SaveRequestDialog';
import PromptActionButtons from './components/PromptActionButtons';
import PromptOutputDisplay from './components/PromptOutputDisplay';
import { AISettings } from './components/AISettings';

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
    validationErrors,
    savedRequests,
    requestPendingDeletion,
    updatePromptData,
    handleGeneratePrompt,
    generateAiPromptHandler,
    handleCopyOutput,
    handleSaveRequest,
    handleDeleteRequest,
    handleLoadRequest,
    handleNewRequestNameChange,
    handleSaveDialogOpen,
    handleSaveDialogClose,
    clearForm,
    handleFieldChange,
    handleCategoryChange,
    showCustomCategory,
    requestInputRef,
    contextInputRef,
    codeInputRef,
    isGenerateDisabled,
    copyToClipboard,
    isCopyDisabled,
    setShowSaveDialog,
    setNewRequestName,
    confirmSaveRequest,
    confirmDeleteRequest,
    cancelDeleteRequest,
  } = usePromptGenerator();

  const { toast } = useToast();

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        ...PROMPT_GENERATOR_SHORTCUTS.GENERATE,
        handler: () => {
          if (!loading && !aiLoading) {
            generateAiPromptHandler();
            toast({
              title: 'Generating with AI...',
              description:
                'Using ' +
                (promptData.aiModel || 'GPT-4 Turbo') +
                ' at ' +
                (promptData.temperature || 0.7) +
                ' temperature',
            });
          }
        },
      },
      {
        ...PROMPT_GENERATOR_SHORTCUTS.CLEAR,
        handler: () => {
          clearForm();
          toast({
            title: 'Form Cleared',
            description: 'All fields have been reset',
          });
        },
      },
      {
        ...PROMPT_GENERATOR_SHORTCUTS.COPY,
        handler: () => {
          if (output) {
            handleCopyOutput();
            toast({
              title: 'Copied!',
              description: 'Prompt copied to clipboard',
            });
          }
        },
      },
      {
        ...PROMPT_GENERATOR_SHORTCUTS.SAVE,
        handler: () => {
          if (output) {
            handleSaveDialogOpen();
          }
        },
      },
    ],
  });

  const form = useForm<PromptData>({
    values: promptData,
  });

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 via-transparent to-blue-100/30 dark:from-purple-950/30 dark:via-transparent dark:to-blue-950/30 blur-3xl"></div>
      </div>
      <div className="bg-card p-6 rounded-lg shadow-xl border border-border/50 relative z-10 backdrop-blur-sm">
        {/* Header Section */}
        <div className="text-center mb-10 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-2xl">
            <Wand2 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl leading-tight bg-gradient-to-r from-purple-400 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
            Prompt Request Generator
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Create structured prompts for any assistance requests to streamline
            your workflow with AI-powered precision.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <Badge
              variant="secondary"
              className="bg-purple-50 text-purple-700 border-purple-200"
            >
              <Zap className="w-3 h-3 mr-1" />
              AI Enhanced
            </Badge>
            <Badge
              variant="secondary"
              className="bg-indigo-50 text-indigo-700 border-indigo-200"
            >
              <Save className="w-3 h-3 mr-1" />
              Auto-Save
            </Badge>
            <Badge
              variant="secondary"
              className="bg-green-50 text-green-700 border-green-200"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Smart Templates
            </Badge>
          </div>
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="flex justify-center mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              toast({
                title: 'Keyboard Shortcuts',
                description:
                  'Ctrl+Enter: Generate prompt\nCtrl+K: Clear form\nCtrl+Shift+C: Copy output\nCtrl+S: Save request',
                duration: 5000,
              });
            }}
            className="gap-2"
          >
            <Keyboard className="w-4 h-4" />
            Shortcuts
          </Button>
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
                requestInputRef={requestInputRef}
                contextInputRef={contextInputRef}
                codeInputRef={codeInputRef}
              />

              {/* AI Settings */}
              <AISettings
                aiModel={promptData.aiModel || 'gpt-4-turbo'}
                temperature={promptData.temperature || 0.7}
                onModelChange={(model) => updatePromptData({ aiModel: model })}
                onTemperatureChange={(temp) =>
                  updatePromptData({ temperature: temp })
                }
                className="mt-6"
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
                generatePromptHandler={handleGeneratePrompt}
                generateAiPromptHandler={generateAiPromptHandler}
                handleSaveRequest={handleSaveDialogOpen}
                requestInput={promptData.request}
                clearForm={clearForm}
                aiModel={promptData.aiModel}
                temperature={promptData.temperature}
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
