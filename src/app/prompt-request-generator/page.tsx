'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { usePromptGenerator } from '@/hooks/use-prompt-generator';
import { useToast } from '@/components/ui/use-toast';
import { PromptData, SavedRequest } from '@/lib/prompt-generator/types';
import { PromptTemplate } from './components/PromptTemplateSelector';
import { useGeneratorShortcuts } from '../../hooks/use-generator-shortcuts';
import { CheckCircle2, CloudOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  { ssr: false },
);

const SaveRequestDialog = dynamic(
  () => import('./components/SaveRequestDialog'),
  { ssr: false },
);

// Custom Components
import PromptInputForm from './components/PromptInputForm';
import PromptActionButtons from './components/PromptActionButtons';

// ------- Autosave indicator -------
type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'offline';

function AutosaveIndicator({ status }: { status: AutosaveStatus }) {
  if (status === 'idle') return null;
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs transition-all duration-300',
        status === 'saving' && 'text-muted-foreground',
        status === 'saved' && 'text-green-600 dark:text-green-400',
        status === 'offline' && 'text-amber-500',
      )}
    >
      {status === 'saving' && <Loader2 className="h-3 w-3 animate-spin" />}
      {status === 'saved' && <CheckCircle2 className="h-3 w-3" />}
      {status === 'offline' && <CloudOff className="h-3 w-3" />}
      <span>
        {status === 'saving'
          ? 'Saving…'
          : status === 'saved'
            ? 'Draft saved'
            : 'Offline — changes not saved'}
      </span>
    </div>
  );
}

/**
 * Prompt Request Generator page.
 * Lets users build structured AI prompts with category, context, code snippets, etc.
 * Supports saving, loading, exporting, and importing prompt requests.
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
    selectedSavedRequestId,
    updatePromptData,
    handleGeneratePrompt,
    handleCopyOutput,
    handleSaveRequest,
    handleDeleteRequest,
    handleUpdateRequest,
    handleUpdateRequestData,
    handleLoadRequest,
    handleSaveDialogOpen,
    handleImportRequests,
    clearForm,
    handleFieldChange,
    handleCategoryChange,
    showCustomCategory,
    requestInputRef,
    contextInputRef,
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ------- Autosave status -------
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('idle');
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  const triggerAutosave = useCallback(() => {
    if (!isOnline) {
      setAutosaveStatus('offline');
      return;
    }
    setAutosaveStatus('saving');
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      setAutosaveStatus('saved');
      autosaveTimerRef.current = setTimeout(
        () => setAutosaveStatus('idle'),
        3000,
      );
    }, 800);
  }, [isOnline]);

  // Fire autosave indicator whenever promptData changes (but not on first mount)
  const isMountedRef = useRef(false);
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    // Only show saving indicator if form has content
    if (promptData.request || promptData.context || promptData.code) {
      triggerAutosave();
    }
  }, [promptData, triggerAutosave]);

  // ------- Export / Import -------
  const handleExportAll = () => {
    if (savedRequests.length === 0) {
      toast({
        title: 'No requests to export',
        description: 'Save some prompts first before exporting.',
        variant: 'destructive',
      });
      return;
    }
    const blob = new Blob([JSON.stringify(savedRequests, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scalesmart-prompts-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: 'Exported',
      description: `${savedRequests.length} request${savedRequests.length !== 1 ? 's' : ''} exported.`,
    });
  };

  const handleImportAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      toast({
        title: 'Import Failed',
        description: 'Only JSON files are supported.',
        variant: 'destructive',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (!Array.isArray(imported))
          throw new Error('Imported data must be an array of requests.');

        if (
          !imported.every(
            (req: any) =>
              req.id &&
              req.name &&
              req.timestamp &&
              req.data &&
              typeof req.data === 'object' &&
              'category' in req.data &&
              'request' in req.data,
          )
        ) {
          throw new Error('Invalid request format in imported file.');
        }

        handleImportRequests(imported);
      } catch (err) {
        toast({
          title: 'Import Failed',
          description:
            err instanceof Error ? err.message : 'Invalid JSON file.',
          variant: 'destructive',
        });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // ------- Keyboard shortcuts -------
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

  const form = useForm<PromptData>({ values: promptData });

  const handleTemplateSelect = (template: PromptTemplate) => {
    updatePromptData(template.data);
    toast({
      title: 'Template Applied',
      description: `Applied "${template.name}" template`,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Ambient background */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 via-transparent to-blue-100/30 dark:from-purple-950/30 dark:via-transparent dark:to-blue-950/30 blur-3xl" />
      </div>

      <div className="bg-card p-6 rounded-lg shadow-xl border border-border/50 relative z-10 backdrop-blur-sm">
        <div className="mt-2 space-y-8">
          {/* Input Form and Controls */}
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-foreground">
                    Request Details
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Fill in the sections below to generate a well-structured
                    prompt
                  </CardDescription>
                </div>
                {/* Autosave indicator — top-right of card header */}
                <div className="pt-0.5 flex-shrink-0">
                  <AutosaveIndicator status={autosaveStatus} />
                </div>
              </div>
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
                selectedSavedRequestId={selectedSavedRequestId}
                handleLoadRequest={(id) => {
                  const request = savedRequests.find((r) => r.id === id);
                  if (request) handleLoadRequest(request);
                }}
                handleDeleteRequest={(id) => {
                  const request = savedRequests.find((r) => r.id === id);
                  if (request) handleDeleteRequest(request);
                }}
                handleUpdateRequest={(id, name) => {
                  const request = savedRequests.find((r) => r.id === id);
                  if (request) handleUpdateRequest({ ...request, name });
                }}
                handleUpdateRequestData={handleUpdateRequestData}
                handleOpenGuide={() => setShowUserGuide(true)}
                handleExportAll={handleExportAll}
                handleImportAll={() => fileInputRef.current?.click()}
              />

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json"
                onChange={handleImportAll}
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

        {/* Dialogs */}
        <SaveRequestDialog
          showSaveDialog={showSaveDialog}
          setShowSaveDialog={setShowSaveDialog}
          newRequestName={newRequestName}
          setNewRequestName={setNewRequestName}
          confirmSaveRequest={confirmSaveRequest}
          requestText={promptData.request}
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
