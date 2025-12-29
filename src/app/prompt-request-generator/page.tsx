'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { usePromptGenerator } from '@/hooks/use-prompt-generator';
import { useToast } from '@/hooks/use-toast';
import { PromptData } from '@/lib/prompt-generator/types';
import { PromptTemplate } from './components/PromptTemplateSelector';
import { useGeneratorShortcuts } from './hooks/use-generator-shortcuts';

// UI Components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

import dynamic from 'next/dynamic';

// Dynamic imports for heavy components
const PromptOutputDisplay = dynamic(
  () => import('./components/PromptOutputDisplay'),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 animate-pulse bg-muted/20 rounded-lg border border-dashed border-border/50" />
    ),
  },
);

const UserGuideModal = dynamic(() => import('./components/UserGuideModal'), {
  ssr: false,
});

const DeleteConfirmationDialog = dynamic(
  () => import('./components/DeleteConfirmationDialog'),
  {
    ssr: false,
  },
);

const SaveRequestDialog = dynamic(
  () => import('./components/SaveRequestDialog'),
  {
    ssr: false,
  },
);

// Custom Components
import PromptInputForm from './components/PromptInputForm';
import PromptActionButtons from './components/PromptActionButtons';

/**
 * A component for generating structured prompts based on user input for code assistance.
 * Allows selecting a category, providing context, describing the request, and including code snippets.
 */
export default function PromptRequestGenerator() {
  const {
    promptData,
    output,
    loading,
    showSaveDialog,
    newRequestName,
    savedRequests,
    requestPendingDeletion,
    updatePromptData,
    handleGeneratePrompt,
    handleCopyOutput,
    handleSaveRequest,
    handleDeleteRequest,
    handleUpdateRequest,
    handleLoadRequest,
    handleSaveDialogOpen,
    clearForm,
    handleFieldChange,
    handleCategoryChange,
    showCustomCategory,
    requestInputRef,
    contextInputRef,
    codeInputRef,
    isGenerateDisabled,
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

  // Initialize keyboard shortcuts
  useGeneratorShortcuts({
    loading,
    output,
    canUndo,
    canRedo,
    promptData,
    handleGeneratePrompt,
    clearForm,
    handleCopyOutput,
    handleSaveDialogOpen,
    undo,
    redo,
    updatePromptData,
  });

  const form = useForm<PromptData>({
    values: promptData,
  });

  const handleTemplateSelect = (template: PromptTemplate) => {
    updatePromptData(template.data);
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
