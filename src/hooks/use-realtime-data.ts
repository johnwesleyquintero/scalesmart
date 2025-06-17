// src/hooks/use-realtime-data.ts

import { useState, useEffect } from 'react';
import { DataConnectorService } from '../lib/data-connector-service';
import {
  DataQuery,
  QueryResult,
} from '../app/dashboard-studio/data-source-types';

export const useRealtimeData = (query: DataQuery | null) => {
  const [data, setData] = useState<QueryResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query || !query.connectionId) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = DataConnectorService.subscribeToData(
      query,
      (newData) => {
        setData(newData);
        setIsLoading(false);
      },
      (err) => {
        // Assert the error type as Error to satisfy setError's type
        setError(err instanceof Error ? err : null); // Check if err is an Error instance, otherwise set to null
        setIsLoading(false);
      },
    );

    return () => {
      // Clean up the subscription when the component unmounts or the query changes
      unsubscribe();
    };
  }, [query]); // Re-run effect if query changes

  return { data, error, isLoading };
};
