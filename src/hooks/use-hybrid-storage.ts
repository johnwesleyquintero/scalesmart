import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  initializeDB,
  setItem,
  getItem,
  deleteItem,
  syncFromSupabase,
  syncToSupabase,
  getRecordFromSupabase, // Import the function to fetch records from Supabase
} from '@/lib/indexeddb-service';

// Extend the generic type T to ensure it includes an 'updated_at' property for synchronization logic.
// This helps in type safety when comparing timestamps from IndexedDB and Supabase.
type TimestampedRecord<T> = T & { updated_at?: string };

/**
 * A custom React hook for managing data with a hybrid storage strategy,
 * combining Supabase (cloud) and IndexedDB (client-side) for offline capabilities
 * and performance optimization.
 *
 * @template T The type of the data records being stored.
 * @param {string} tableName The name of the Supabase table corresponding to the data.
 * @param {keyof T} keyField The field in the record that serves as its unique identifier (e.g., 'id').
 * @returns An object containing online status, loading state, error, syncing status,
 *          and functions for data operations (getData, saveData, deleteData, syncFromSupabase, syncToSupabase).
 */
export function useHybridStorage<T>(tableName: string, keyField: keyof T) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Initialize client-side Supabase client.
  const supabase = createClient();

  /**
   * Effect hook for handling online/offline status changes and initial database synchronization.
   * It sets up event listeners for network status and performs an initial sync from Supabase
   * to IndexedDB when the component mounts and the application is online.
   */
  useEffect(() => {
    const handleOnlineStatusChange = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    // Asynchronous initialization function for IndexedDB and initial data sync.
    const init = async () => {
      try {
        await initializeDB(); // Ensure IndexedDB is initialized.
        if (navigator.onLine) {
          setIsSyncing(true); // Indicate that a sync operation is in progress.
          // Perform an initial pull of data from Supabase to populate IndexedDB.
          await syncFromSupabase(supabase, tableName, keyField as string);
          // Push any pending offline changes from IndexedDB to Supabase.
          await syncToSupabase(supabase);
          setIsSyncing(false); // Reset sync status.
        }
      } catch (err) {
        console.error('Error during initialization or initial sync:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false); // Mark loading as complete regardless of success or failure.
      }
    };

    init(); // Execute the initialization.

    // Cleanup function to remove event listeners when the component unmounts.
    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, [supabase, tableName, keyField]); // Dependencies: re-run if Supabase client, table name, or key field changes.

  /**
   * Effect hook for triggering synchronization to Supabase when the application comes back online.
   * This ensures that any changes made offline are pushed to the cloud database.
   */
  useEffect(() => {
    // Only attempt to sync if online and no other sync operation is currently in progress.
    if (isOnline && !isSyncing) {
      const syncOfflineChanges = async () => {
        setIsSyncing(true); // Indicate that a sync operation is in progress.
        try {
          await syncToSupabase(supabase); // Push pending offline changes to Supabase.
        } catch (err) {
          console.error('Error syncing offline changes:', err);
          setError(err as Error);
        } finally {
          setIsSyncing(false); // Reset sync status.
        }
      };
      syncOfflineChanges(); // Execute the sync.
    }
  }, [isOnline, isSyncing, supabase]); // Dependencies: re-run if online status, sync status, or Supabase client changes.

  /**
   * Fetches data for a specific record, prioritizing IndexedDB for speed
   * and synchronizing with Supabase if online and data is stale or missing.
   * @param recordId The ID of the record to retrieve.
   * @returns The record data, or undefined if not found.
   */
  const getData = async (recordId: string): Promise<T | undefined> => {
    const key = `${tableName}-${recordId}`; // Construct a unique key for IndexedDB.
    try {
      // Attempt to retrieve data from IndexedDB first for immediate responsiveness.
      const indexedDbData = await getItem<TimestampedRecord<T>>(key);

      // If online, perform a staleness check and synchronize with Supabase if necessary.
      if (isOnline) {
        try {
          // Fetch the latest version of the record from Supabase.
          const supabaseData = await getRecordFromSupabase<
            TimestampedRecord<T>
          >(supabase, tableName, recordId);

          // Determine timestamps for comparison. Default to 0 if 'updated_at' is missing.
          const indexedDbTimestamp = indexedDbData?.updated_at
            ? new Date(indexedDbData.updated_at).getTime()
            : 0;
          const supabaseTimestamp = supabaseData?.updated_at
            ? new Date(supabaseData.updated_at).getTime()
            : 0;

          // Scenario 1: Supabase has newer data.
          if (supabaseData && supabaseTimestamp > indexedDbTimestamp) {
            console.log(
              `IndexedDB data for ${key} is stale. Syncing from Supabase.`,
            );
            // Trigger a full table sync to update the local cache with the latest data.
            // This ensures consistency for the entire table, not just the single record.
            await syncFromSupabase(supabase, tableName, keyField as string);
            // After syncing, retrieve the potentially updated data from IndexedDB.
            return await getItem<T>(key);
          }
          // Scenario 2: Record exists in Supabase but not in IndexedDB.
          else if (!indexedDbData && supabaseData) {
            console.log(
              `Record ${key} not found in IndexedDB but exists in Supabase. Syncing table.`,
            );
            await syncFromSupabase(supabase, tableName, keyField as string);
            return await getItem<T>(key);
          }
          // Scenario 3: Record exists in IndexedDB but has been deleted in Supabase.
          else if (indexedDbData && !supabaseData) {
            console.log(
              `Record ${key} found in IndexedDB but deleted in Supabase. Considering local deletion.`,
            );
            // Depending on the application's conflict resolution strategy,
            // you might want to delete the local record here to reflect server state.
            // await deleteItem(tableName, recordId);
            return undefined; // Return undefined as the record is no longer on the server.
          }
        } catch (syncError) {
          console.error(
            'Error during staleness check or sync with Supabase:',
            syncError,
          );
          // If sync fails, proceed with the IndexedDB data to maintain offline functionality.
        }
      }

      // Return IndexedDB data if offline, or if online check found no newer data.
      return indexedDbData;
    } catch (err) {
      console.error(`Failed to retrieve data for key ${key}:`, err);
      setError(err as Error);
      throw err; // Re-throw to allow the calling component to handle the error.
    }
  };

  /**
   * Saves or updates a record in IndexedDB and queues it for synchronization with Supabase.
   * @param recordId The ID of the record to save.
   * @param value The data to store.
   */
  const saveData = async (recordId: string, value: T): Promise<void> => {
    try {
      // Save to IndexedDB immediately for a responsive user experience.
      await setItem(tableName, recordId, value);

      // If online, attempt to synchronize the change with Supabase immediately.
      if (isOnline) {
        setIsSyncing(true); // Indicate that a sync operation is in progress.
        try {
          await syncToSupabase(supabase); // Push pending changes to Supabase.
        } catch (err) {
          console.error('Error syncing data after save:', err);
          // If synchronization fails, the change remains in the sync queue for a later attempt.
          setError(err as Error);
        } finally {
          setIsSyncing(false); // Reset sync status.
        }
      }
    } catch (err) {
      console.error(`Failed to save data for record ${recordId}:`, err);
      setError(err as Error);
      throw err; // Re-throw to allow the calling component to handle the error.
    }
  };

  /**
   * Deletes a record from IndexedDB and queues the deletion for synchronization with Supabase.
   * @param recordId The ID of the record to delete.
   */
  const deleteData = async (recordId: string): Promise<void> => {
    try {
      // Delete from IndexedDB immediately for a responsive user experience.
      await deleteItem(tableName, recordId);

      // If online, attempt to synchronize the deletion with Supabase immediately.
      if (isOnline) {
        setIsSyncing(true); // Indicate that a sync operation is in progress.
        try {
          await syncToSupabase(supabase); // Push pending deletions to Supabase.
        } catch (err) {
          console.error('Error syncing data after delete:', err);
          // If synchronization fails, the deletion remains in the sync queue for a later attempt.
          setError(err as Error);
        } finally {
          setIsSyncing(false); // Reset sync status.
        }
      }
    } catch (err) {
      console.error(`Failed to delete data for record ${recordId}:`, err);
      setError(err as Error);
      throw err; // Re-throw to allow the calling component to handle the error.
    }
  };

  return {
    isOnline,
    isLoading,
    error,
    isSyncing,
    getData,
    saveData,
    deleteData,
    // Expose sync functions if needed for manual triggers
    syncFromSupabase: () =>
      syncFromSupabase(supabase, tableName, keyField as string), // Cast keyField to string
    syncToSupabase: () => syncToSupabase(supabase),
  };
}
