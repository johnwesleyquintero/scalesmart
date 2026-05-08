import { getCacheItem, setCacheItem } from '@/lib/localstorage-service';
import { PromptData, SavedRequest } from './types';
import { AUTOSAVE_KEY, SAVED_REQUESTS_KEY } from './constants';
import { initialState } from './state';

/**
 * Loads the auto-saved form state from storage.
 */
export async function loadAutoSavedState(): Promise<PromptData | null> {
  try {
    const savedState = await getCacheItem<PromptData>(AUTOSAVE_KEY);
    if (savedState && typeof savedState === 'object') {
      const data = savedState as any;
      // Migration logic: consolidate codeInput into code and prevent duplication
      if (data.codeInput !== undefined) {
        if (data.code === undefined) {
          data.code = data.codeInput;
        }
        delete data.codeInput;
      }
      return data as PromptData;
    }
  } catch (error) {
    console.error('Failed to load auto-saved form state', error);
  }
  return null;
}

/**
 * Saves the current form state to storage.
 */
export async function saveAutoSavedState(data: PromptData): Promise<void> {
  try {
    // Only save if there's actual content
    if (data.request || data.context || data.code) {
      await setCacheItem(AUTOSAVE_KEY, data);
    }
  } catch (error) {
    console.error('Failed to auto-save form state', error);
  }
}

/**
 * Clears the auto-saved form state from storage.
 */
export async function clearAutoSavedState(): Promise<void> {
  try {
    await setCacheItem(AUTOSAVE_KEY, initialState.promptData);
  } catch (error) {
    console.error('Failed to clear auto-saved state', error);
  }
}

/**
 * Loads all saved prompt requests from storage.
 */
export async function loadSavedRequests(): Promise<SavedRequest[]> {
  try {
    const saved = await getCacheItem<SavedRequest[]>(SAVED_REQUESTS_KEY);
    if (Array.isArray(saved)) {
      return saved.map((req) => {
        const data = req.data as any;
        // Migration logic: consolidate codeInput into code and prevent duplication
        if (data.codeInput !== undefined) {
          if (data.code === undefined) {
            data.code = data.codeInput;
          }
          delete data.codeInput;
        }
        return req;
      });
    }
  } catch (error) {
    console.error('Failed to load saved requests', error);
  }
  return [];
}

/**
 * Saves the list of prompt requests to storage.
 */
export async function savePromptRequests(
  requests: SavedRequest[],
): Promise<void> {
  try {
    if (requests === null || requests === undefined) {
      return;
    }
    await setCacheItem(SAVED_REQUESTS_KEY, requests);
  } catch (error) {
    console.error('Failed to save requests to storage', error);
    throw error;
  }
}
