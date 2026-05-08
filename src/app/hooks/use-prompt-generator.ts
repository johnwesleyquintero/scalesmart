'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  CategoryValue,
  PromptData,
  SavedRequest,
} from '@/lib/prompt-generator/types';
import { CUSTOM_CATEGORY_VALUE } from '@/lib/prompt-generator/constants';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'scalesmart_saved_prompts';

const initialPromptData: PromptData = {
  category: 'General Assistance', // Changed from 'General' to 'General Assistance' for consistency with state.ts
  customCategory: '',
  context: '',
  request: '',
  code: '', // Initialized 'code' property
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

  // --- Initialization ---
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSavedRequests(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse saved requests', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedRequests));
  }, [savedRequests]);

  // --- Helpers ---
  const isGenerateDisabled = useMemo(() => {
    return !promptData.request.trim() || loading;
  }, [promptData.request, loading]);

  const updatePromptData = useCallback(
    (newData: Partial<PromptData>) => {
      setPromptData((prev) => {
        const updated = { ...prev, ...newData };

        // Add to history if it's a significant change
        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, updated]);
        setHistoryIndex(newHistory.length);

        return updated;
      });
    },
    [history, historyIndex],
  );

  // --- Handlers ---
  const handleFieldChange = (
    field: Exclude<keyof PromptData, 'category'>,
    value: string,
  ) => {
    updatePromptData({ [field]: value });
  };

  const handleCategoryChange = (value: CategoryValue) => {
    setShowCustomCategory(value === CUSTOM_CATEGORY_VALUE);
    updatePromptData({ category: value });
  };

  const handleGeneratePrompt = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate a small delay for "Execution System" feel
      await new Promise((res) => setTimeout(res, 600));

      const category =
        promptData.category === CUSTOM_CATEGORY_VALUE
          ? promptData.customCategory
          : promptData.category;

      const sections = [
        '### ROLE\nExpert Software Engineer / Coding Assistant',
        `### CATEGORY\n${category}`,
        `### CONTEXT\n${promptData.context || 'No additional context provided.'}`,
        `### REQUEST\n${promptData.request}`,
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

      if (promptData.code) {
        sections.push(`### CODE SNIPPET\n\`\`\`\n${promptData.code}\n\`\`\``);
      }

      const formattedPrompt = sections.join('\n\n').trim();

      setOutput(formattedPrompt);
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
    toast({ description: 'Form cleared.' });
  }, [toast]);

  // --- Save / Load / Delete Logic ---
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
    setNewRequestName(`Request ${savedRequests.length + 1}`);
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
    setShowSaveDialog(false);
    toast({
      title: 'Saved',
      description: `"${newSavedRequest.name}" has been saved.`,
    });
  };

  const handleLoadRequest = (request: SavedRequest) => {
    setPromptData(request.data);
    setShowCustomCategory(request.data.category === CUSTOM_CATEGORY_VALUE);
    toast({ title: 'Loaded', description: `Loaded "${request.name}"` });
  };

  const handleUpdateRequest = (id: string) => {
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
  };

  const handleDeleteRequest = (request: SavedRequest) => {
    setRequestPendingDeletion(request);
  };

  const confirmDeleteRequest = () => {
    if (requestPendingDeletion) {
      setSavedRequests((prev) =>
        prev.filter((r) => r.id !== requestPendingDeletion.id),
      );
      setRequestPendingDeletion(null);
      toast({ title: 'Deleted', description: 'Request removed.' });
    }
  };

  const cancelDeleteRequest = () => setRequestPendingDeletion(null);

  // --- Undo / Redo Logic ---
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

    // History
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    undo,
    redo,

    // Refs
    requestInputRef,
    contextInputRef,
    codeInputRef,

    // Logic state
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

    // CRUD Handlers
    handleSaveRequest,
    handleSaveDialogOpen,
    confirmSaveRequest,
    handleLoadRequest,
    handleUpdateRequest,
    handleDeleteRequest,
    confirmDeleteRequest,
    cancelDeleteRequest,
  };
}
