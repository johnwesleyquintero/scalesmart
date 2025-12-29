'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { usePromptGenerator } from '@/hooks/use-prompt-generator';
import {
  useKeyboardShortcuts,
  PROMPT_GENERATOR_SHORTCUTS,
} from '@/hooks/use-keyboard-shortcuts';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Wand2 } from 'lucide-react';
import { PromptData } from '@/lib/prompt-generator/types';
import { useToast } from '@/hooks/use-toast';
import { PromptTemplate } from './components/PromptTemplateSelector';

// Import new components
import DeleteConfirmationDialog from './components/DeleteConfirmationDialog';
import PromptInputForm from './components/PromptInputForm';
import SaveRequestDialog from './components/SaveRequestDialog';
import PromptActionButtons from './components/PromptActionButtons';
import PromptOutputDisplay from './components/PromptOutputDisplay';
import UserGuideModal from './components/UserGuideModal';

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
    showSaveDialog,
    newRequestName,
    selectedSavedRequestId,
    validationErrors,
    savedRequests,
    requestPendingDeletion,
    updatePromptData,
    handleGeneratePrompt,
    handleCopyOutput,
    handleSaveRequest,
    handleDeleteRequest,
    handleUpdateRequest,
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
    undo,
    redo,
    canUndo,
    canRedo,
  } = usePromptGenerator();

  const { toast } = useToast();
  const [showUserGuide, setShowUserGuide] = useState(false);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        ...PROMPT_GENERATOR_SHORTCUTS.GENERATE,
        handler: () => {
          if (!loading) {
            handleGeneratePrompt();
            toast({
              title: 'Generating prompt...',
              description: 'Creating your structured request',
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
      {
        ...PROMPT_GENERATOR_SHORTCUTS.UNDO,
        handler: () => {
          if (canUndo) {
            undo();
            toast({
              title: 'Undone',
              description: 'Previous state restored',
            });
          }
        },
      },
      {
        ...PROMPT_GENERATOR_SHORTCUTS.REDO,
        handler: () => {
          if (canRedo) {
            redo();
            toast({
              title: 'Redone',
              description: 'Next state restored',
            });
          }
        },
      },
      {
        ...PROMPT_GENERATOR_SHORTCUTS.TEMPLATES,
        handler: () => {
          // Scroll to templates section
          const templatesSection = document.querySelector(
            '[data-templates-section]',
          );
          if (templatesSection) {
            templatesSection.scrollIntoView({ behavior: 'smooth' });
          }
          toast({
            title: 'Templates',
            description: 'Opening templates section',
          });
        },
      },
      {
        ...PROMPT_GENERATOR_SHORTCUTS.DUPLICATE,
        handler: () => {
          if (promptData.request) {
            // Create a copy of current request
            const duplicatedData = {
              ...promptData,
              request: promptData.request + ' (Copy)',
            };
            Object.entries(duplicatedData).forEach(([key, value]) => {
              updatePromptData({ [key]: value } as Partial<PromptData>);
            });
            toast({
              title: 'Duplicated',
              description: 'Current request duplicated',
            });
          }
        },
      },
    ],
  });

  const form = useForm<PromptData>({
    values: promptData,
  });

  const handleTemplateSelect = (template: PromptTemplate) => {
    // Apply template data to form
    Object.entries(template.data).forEach(([key, value]) => {
      if (value) {
        updatePromptData({ [key]: value } as Partial<PromptData>);
      }
    });

    toast({
      title: 'Template Applied',
      description: `Applied "${template.name}" template`,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 via-transparent to-blue-100/30 dark:from-purple-950/30 dark:via-transparent dark:to-blue-950/30 blur-3xl"></div>
      </div>
      <div className="bg-card p-6 rounded-lg shadow-xl border border-border/50 relative z-10 backdrop-blur-sm">
        {/* Full-Width Layout */}
        <div className="mt-2 space-y-8">
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
                onSelectTemplate={handleTemplateSelect}
                requestInputRef={requestInputRef}
                contextInputRef={contextInputRef}
                codeInputRef={codeInputRef}
              />

              <PromptActionButtons
                isGenerateDisabled={isGenerateDisabled}
                loading={loading}
                generatePromptHandler={handleGeneratePrompt}
                handleSaveRequest={handleSaveRequest}
                requestInput={promptData.request}
                clearForm={clearForm}
                undo={undo}
                redo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
                savedRequests={savedRequests}
                handleLoadRequest={handleLoadRequest}
                handleDeleteRequest={handleDeleteRequest}
                handleUpdateRequest={handleUpdateRequest}
                handleOpenGuide={() => setShowUserGuide(true)}
              />
            </CardContent>
          </Card>

          {/* Output Display */}
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground">
                Generated Prompt
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Ready to copy and use
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PromptOutputDisplay output={output} isLoading={loading} />
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
        <UserGuideModal open={showUserGuide} onOpenChange={setShowUserGuide} />
      </div>
    </div>
  );
}
