/**
 * Simple localStorage service for prompt request generator
 * Replaces IndexedDB with a simpler approach using localStorage
 */

const STORAGE_PREFIX = 'portfolio_';

/**
 * Get an item from localStorage
 */
export async function getCacheItem<T>(key: string): Promise<T | undefined> {
  try {
    const fullKey = STORAGE_PREFIX + key;
    const item = localStorage.getItem(fullKey);
    if (item === null) {
      return undefined;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error('Error getting cache item:', error);
    return undefined;
  }
}

/**
 * Set an item in localStorage
 */
export async function setCacheItem<T>(key: string, value: T): Promise<string> {
  try {
    const fullKey = STORAGE_PREFIX + key;
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(fullKey, serializedValue);
    return fullKey;
  } catch (error) {
    console.error('Error setting cache item:', error);
    throw error;
  }
}

/**
 * Remove an item from localStorage
 */
export async function removeCacheItem(key: string): Promise<void> {
  try {
    const fullKey = STORAGE_PREFIX + key;
    localStorage.removeItem(fullKey);
  } catch (error) {
    console.error('Error removing cache item:', error);
  }
}
