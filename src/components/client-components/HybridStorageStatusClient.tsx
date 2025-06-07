'use client';

import { useHybridStorage } from '@/hooks/use-hybrid-storage';

export function HybridStorageStatusClient() {
  const { isOnline, isLoading, error, isSyncing } = useHybridStorage(
    'general_data',
    'key',
  ); // Placeholder values

  return (
    <div className="text-sm text-gray-600">
      Status: {isLoading ? 'Loading...' : 'Ready'} | Online:{' '}
      {isOnline ? 'Yes' : 'No'} | Syncing: {isSyncing ? 'Yes' : 'No'}
      {error && <span className="text-red-500"> | Error: {error.message}</span>}
    </div>
  );
}
