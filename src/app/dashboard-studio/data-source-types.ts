// src/app/dashboard-studio/data-source-types.ts

export enum DataSourceType {
  LocalCSV = 'local-csv',
  IndexedDB = 'indexeddb',
  Custom = 'custom', // For self-service connectors
}

export interface DataSourceConnection {
  id: string;
  name: string;
  type: DataSourceType;
  // Credentials and connection details would be stored securely elsewhere
  // This interface represents the connection configuration
  connectionDetails: Record<string, unknown>;
}

export interface DataTransformation {
  id: string;
  name: string;
  type: 'filter' | 'aggregate' | 'join' | 'custom'; // Example transformation types
  config: Record<string, unknown>;
}

export interface DataQuery {
  connectionId: string;
  query: string; // Or a more structured query definition
  transformations?: DataTransformation[];
  refreshInterval?: number; // Optional refresh interval in milliseconds for streaming sources
}

export interface QueryResult {
  columns: { name: string; type: string }[];
  rows: unknown[][];
}

// Interface for the base connector structure
export interface BaseConnector {
  connect(connectionDetails: Record<string, unknown>): Promise<void>;
  disconnect(): Promise<void>;
  executeQuery(query: DataQuery): Promise<QueryResult>;
  subscribe?(
    query: DataQuery,
    onData: (data: QueryResult) => void,
    onError: (error: Error) => void,
  ): () => void; // Optional subscribe method for streaming
  // Add methods for schema introspection, etc.
}
