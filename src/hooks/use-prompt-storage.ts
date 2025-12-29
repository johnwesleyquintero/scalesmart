import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { PromptData, SavedRequest } from '@/lib/prompt-generator/types';
import {
  loadAutoSavedState,
  saveAutoSavedState,
  loadSavedRequests,
  savePromptRequests,
} from '@/lib/prompt-generator/storage';
import { AUTOSAVE_DEBOUNCE_MS } from '@/lib/prompt-generator/constants';

interface UsePromptStorageOptions {
  promptData: PromptData;
  savedRequests: SavedRequest[];
  selectedSavedRequestId: string | null;
  onLoadRequests: (requests: SavedRequest[]) => void;
  onLoadAutoSavedState: (state: PromptData) => void;
  isInitialMount: boolean;
}

export function usePromptStorage({
  promptData,
  savedRequests,
  selectedSavedRequestId,
  onLoadRequests,
  onLoadAutoSavedState,
  isInitialMount,
}: UsePromptStorageOptions) {
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load requests on mount
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const loadedData = await loadSavedRequests();
        if (loadedData.length > 0) {
          onLoadRequests(loadedData);
        }
      } catch (error) {
        toast.error('Could not load saved requests.');
      }
    };
    fetchRequests();
  }, [onLoadRequests]);

  // Load auto-saved state on mount
  useEffect(() => {
    const fetchAutoSavedState = async () => {
      const savedState = await loadAutoSavedState();
      if (savedState) {
        // Only load if we don't have a loaded request and form is empty
        if (!selectedSavedRequestId && !promptData.request) {
          onLoadAutoSavedState(savedState);
        }
      }
    };

    if (isInitialMount) {
      fetchAutoSavedState();
    }
  }, [
    isInitialMount,
    selectedSavedRequestId,
    promptData.request,
    onLoadAutoSavedState,
  ]);

  // Auto-save form state
  useEffect(() => {
    if (isInitialMount || selectedSavedRequestId) {
      return;
    }

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      await saveAutoSavedState(promptData);
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [promptData, selectedSavedRequestId, isInitialMount]);

  // Save requests when they change
  useEffect(() => {
    if (isInitialMount) return;

    const saveRequests = async () => {
      try {
        await savePromptRequests(savedRequests);
      } catch (error) {
        toast.error('Could not save requests.');
      }
    };
    saveRequests();
  }, [savedRequests, isInitialMount]);
}
