'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  CategoryValue,
  PromptData,
  SavedRequest,
} from '@/lib/prompt-generator/types';
import { CUSTOM_CATEGORY_VALUE } from '@/lib/prompt-generator/constants';
import { useToast } from '@/components/ui/use-toast';

const STORAGE_KEY = 'scalesmart_saved_prompts';

const initialPromptData: PromptData = {
  category: 'General Assistance',
  customCategory: '',
  context: '',
  request: '',
  code: '',
  parentTask: '',
  subtask: '',
  outputFormat: '',
  constraints: '',
  examples: '',
  tone: '',
  additionalInfo: '',
};

export function usePromptGenerator() {
  const { toast } = useToast();

  // --- State ---
  const [promptData, setPromptData] = useState<PromptData>(initialPromptData);
  const [output, setOutput] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [savedRequests, setSavedRequests] = useState<SavedRequest[]>([]);
  const [selectedSavedRequestId, setSelectedSavedRequestId] = useState<
    string | null
  >(null);

  // Dialog States
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newRequestName, setNewRequestName] = useState('');
  const [requestPendingDeletion, setRequestPendingDeletion] =
    useState<SavedRequest | null>(null);
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  // History (Undo/Redo)
  const [history, setHistory] = useState<PromptData[]>([initialPromptData]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Refs
  const requestInputRef = useRef<HTMLTextAreaElement>(null);
  const contextInputRef = useRef<HTMLTextAreaElement>(null);
  const codeInputRef = useRef<HTMLTextAreaElement>(null);

  // --- Persistence ---
  // Load on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSavedRequests(JSON.parse(stored));
    } catch (e) {
      console.error('Failed to parse saved requests', e);
    }
  }, []);

  // Persist whenever savedRequests changes (skip initial empty state)
  const isFirstSave = useRef(true);
  useEffect(() => {
    if (isFirstSave.current) {
      isFirstSave.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedRequests));
    } catch (e) {
      console.error('Failed to persist saved requests', e);
    }
  }, [savedRequests]);

  // --- Helpers ---
  const isGenerateDisabled = useMemo(() => {
    return !promptData.request.trim() || loading;
  }, [promptData.request, loading]);

  const updatePromptData = useCallback(
    (newData: Partial<PromptData>) => {
      setPromptData((prev) => {
        const updated = { ...prev, ...newData };
        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, updated]);
        setHistoryIndex(newHistory.length);
        return updated;
      });
    },
    [history, historyIndex],
  );

  // --- Field Handlers ---
  const handleFieldChange = (
    field: Exclude<keyof PromptData, 'category'>,
    value: string,
  ) => {
    // Clear selectedSavedRequestId when user edits (they diverged from the saved state)
    updatePromptData({ [field]: value });
  };

  const handleCategoryChange = (value: CategoryValue) => {
    setShowCustomCategory(value === CUSTOM_CATEGORY_VALUE);
    updatePromptData({ category: value });
  };

  // --- Generate ---
  const handleGeneratePrompt = useCallback(async () => {
    setLoading(true);
    try {
      await new Promise((res) => setTimeout(res, 600));

      const category =
        promptData.category === CUSTOM_CATEGORY_VALUE
          ? promptData.customCategory
          : promptData.category;

      const sections = [
        '### ROLE\nPersonal and Coding Assistant.',
        `### CATEGORY\n${category}`,
        `### REQUEST\n${promptData.request}`,
        `### CONTEXT\n${promptData.context || 'No additional context provided.'}`,
      ];

      if (promptData.parentTask)
        sections.push(`### PARENT TASK\n${promptData.parentTask}`);
      if (promptData.subtask)
        sections.push(`### SUBTASK\n${promptData.subtask}`);
      if (promptData.outputFormat)
        sections.push(`### OUTPUT FORMAT\n${promptData.outputFormat}`);
      if (promptData.constraints)
        sections.push(`### CONSTRAINTS\n${promptData.constraints}`);
      if (promptData.examples)
        sections.push(`### EXAMPLES\n${promptData.examples}`);
      if (promptData.tone) sections.push(`### TONE\n${promptData.tone}`);
      if (promptData.additionalInfo)
        sections.push(`### ADDITIONAL INFO\n${promptData.additionalInfo}`);
      if (promptData.code)
        sections.push(`### CODE SNIPPET\n\`\`\`\n${promptData.code}\n\`\`\``);

      setOutput(sections.join('\n\n').trim());
      toast({
        title: 'Prompt Generated',
        description: 'Your structured request is ready.',
      });
    } finally {
      setLoading(false);
    }
  }, [promptData, toast]);

  const handleCopyOutput = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    toast({ title: 'Copied!', description: 'Prompt copied to clipboard.' });
  }, [output, toast]);

  const clearForm = useCallback(() => {
    setPromptData(initialPromptData);
    setOutput('');
    setHistory([initialPromptData]);
    setHistoryIndex(0);
    setSelectedSavedRequestId(null);
    toast({ description: 'Form cleared.' });
  }, [toast]);

  // --- Save / Load / Delete ---
  const handleSaveDialogOpen = () => setShowSaveDialog(true);

  const handleSaveRequest = () => {
    if (!promptData.request) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Cannot save an empty request.',
      });
      return;
    }
    // Pre-fill with a smart default name derived from the request text
    const snippet = promptData.request.trim().slice(0, 40);
    const lastSpace = snippet.lastIndexOf(' ');
    const suggested = lastSpace > 10 ? snippet.slice(0, lastSpace) : snippet;
    setNewRequestName(suggested || `Request ${savedRequests.length + 1}`);
    setShowSaveDialog(true);
  };

  const confirmSaveRequest = () => {
    const newSavedRequest: SavedRequest = {
      id: crypto.randomUUID(),
      name: newRequestName || `Request ${savedRequests.length + 1}`,
      data: { ...promptData },
      timestamp: Date.now(),
    };
    setSavedRequests((prev) => [newSavedRequest, ...prev]);
    setSelectedSavedRequestId(newSavedRequest.id);
    setShowSaveDialog(false);
    toast({
      title: 'Saved',
      description: `"${newSavedRequest.name}" has been saved.`,
    });
  };

  const handleLoadRequest = (request: SavedRequest) => {
    setPromptData(request.data);
    setShowCustomCategory(request.data.category === CUSTOM_CATEGORY_VALUE);
    setSelectedSavedRequestId(request.id);
    setOutput('');
    toast({ title: 'Loaded', description: `Loaded "${request.name}"` });
  };

  /** Rename a saved request (name only, not its data) */
  const handleUpdateRequest = (request: SavedRequest) => {
    setSavedRequests((prev) =>
      prev.map((r) => (r.id === request.id ? { ...r, name: request.name } : r)),
    );
    toast({ title: 'Renamed', description: `Request renamed.` });
  };

  /** Overwrite a saved request's data with current form state */
  const handleUpdateRequestData = useCallback(
    (id: string) => {
      setSavedRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, data: { ...promptData }, timestamp: Date.now() }
            : r,
        ),
      );
      toast({
        title: 'Updated',
        description: 'Saved request updated with current form data.',
      });
    },
    [promptData, toast],
  );

  const handleDeleteRequest = (request: SavedRequest) => {
    setRequestPendingDeletion(request);
  };

  const confirmDeleteRequest = () => {
    if (requestPendingDeletion) {
      setSavedRequests((prev) =>
        prev.filter((r) => r.id !== requestPendingDeletion.id),
      );
      if (selectedSavedRequestId === requestPendingDeletion.id) {
        setSelectedSavedRequestId(null);
      }
      setRequestPendingDeletion(null);
      toast({ title: 'Deleted', description: 'Request removed.' });
    }
  };

  const cancelDeleteRequest = () => setRequestPendingDeletion(null);

  const handleImportRequests = useCallback(
    (requests: SavedRequest[]) => {
      setSavedRequests(requests);
      setSelectedSavedRequestId(null);
      toast({
        title: 'Imported',
        description: `${requests.length} request${requests.length !== 1 ? 's' : ''} imported.`,
      });
    },
    [toast],
  );

  // --- Undo / Redo ---
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setPromptData(history[prevIndex]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setPromptData(history[nextIndex]);
    }
  }, [history, historyIndex]);

  return {
    // State
    promptData,
    output,
    loading,
    showSaveDialog,
    newRequestName,
    savedRequests,
    requestPendingDeletion,
    showCustomCategory,
    selectedSavedRequestId,

    // History
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    undo,
    redo,

    // Refs
    requestInputRef,
    contextInputRef,
    codeInputRef,

    // Derived
    isGenerateDisabled,

    // Setters
    setShowSaveDialog,
    setNewRequestName,

    // Handlers
    updatePromptData,
    handleFieldChange,
    handleCategoryChange,
    handleGeneratePrompt,
    handleCopyOutput,
    clearForm,

    // CRUD
    handleSaveRequest,
    handleSaveDialogOpen,
    confirmSaveRequest,
    handleLoadRequest,
    handleUpdateRequest,
    handleUpdateRequestData,
    handleDeleteRequest,
    handleImportRequests,
    confirmDeleteRequest,
    cancelDeleteRequest,
  };
}
