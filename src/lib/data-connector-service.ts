// src/lib/data-connector-service.ts

import Papa from 'papaparse'; // Import Papa Parse

// Placeholder interfaces for types that were in dashboard-studio
export enum DataSourceType {
  LocalCSV = 'LocalCSV',
  IndexedDB = 'IndexedDB',
  Custom = 'Custom',
}

export interface DataSourceConnection {
  id: string;
  name: string;
  type: DataSourceType;
  connectionDetails: Record<string, unknown>;
}

export interface DataQuery {
  connectionId: string;
  query: string; // Assuming query is a string for CSV content or IndexedDB store name
  transformations?: DataTransformation[];
}

export interface QueryResult {
  columns: { name: string; type: string }[];
  rows: unknown[][];
}

export interface BaseConnector {
  connect(connectionDetails: Record<string, unknown>): Promise<void>;
  disconnect(): Promise<void>;
  executeQuery(query: DataQuery): Promise<QueryResult>;
  subscribe?(
    query: DataQuery,
    onData: (data: QueryResult) => void,
    onError: (error: unknown) => void,
  ): () => void;
}

export interface DataTransformation {
  type: string; // e.g., 'filter', 'aggregate'
  config: Record<string, unknown>;
}

// For this application, we will focus on local data sources like IndexedDB or CSV imports.
// Cloud-based data connectors (Snowflake, Kafka, Kinesis) are removed to align with the
// goal of creating functional local tools without external database dependencies.
class LocalCSVConnector implements BaseConnector {
  async connect(connectionDetails: Record<string, unknown>): Promise<void> {
    console.log('Connecting to Local CSV...', connectionDetails);
    // No actual connection needed for local CSV, just simulate readiness
    return Promise.resolve();
  }

  async disconnect(): Promise<void> {
    console.log('Disconnecting from Local CSV...');
    return Promise.resolve();
  }

  async executeQuery(query: DataQuery): Promise<QueryResult> {
    console.log('Executing Local CSV query:', query);
    // In a real application, this would involve parsing a local CSV file
    // The query.query is expected to be the CSV content string
    if (typeof query.query !== 'string' || !query.query.trim()) {
      throw new Error(
        'CSV query must be a non-empty string containing CSV data.',
      );
    }

    return new Promise((resolve, reject) => {
      Papa.parse(query.query, {
        header: true, // Assume the first row is the header
        dynamicTyping: true, // Attempt to convert values to appropriate types (numbers, booleans)
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.error('CSV parsing errors:', results.errors);
            reject(
              new Error('Failed to parse CSV: ' + results.errors[0].message),
            );
            return;
          }

          const data = results.data;
          if (data.length === 0) {
            resolve({ columns: [], rows: [] });
            return;
          }

          const columns = Object.keys(data[0] as Record<string, unknown>).map(
            (key) => ({
              name: key,
              type: typeof (data[0] as Record<string, unknown>)[key], // Infer type from first row
            }),
          );

          const rows = data.map((row) =>
            Object.values(row as Record<string, unknown>),
          );
          resolve({ columns, rows });
        },
        error: (error: Error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        },
      });
    });
  }
}

import { getAllItems } from './indexeddb-service'; // Import IndexedDB service functions

class IndexedDBConnector implements BaseConnector {
  async connect(connectionDetails: Record<string, unknown>): Promise<void> {
    console.log('Connecting to IndexedDB...', connectionDetails);
    // No explicit connection needed for IndexedDB, it's always available
    return Promise.resolve();
  }

  async disconnect(): Promise<void> {
    console.log('Disconnecting from IndexedDB...');
    return Promise.resolve();
  }

  async executeQuery(query: DataQuery): Promise<QueryResult> {
    console.log('Executing IndexedDB query:', query);
    // In a real application, this would involve querying IndexedDB
    // The query.query is expected to be the store name (string)
    if (typeof query.query !== 'string' || !query.query.trim()) {
      throw new Error(
        'IndexedDB query must be a non-empty string representing the store name.',
      );
    }

    try {
      const items = await getAllItems<Record<string, unknown>>(query.query);

      if (items.length === 0) {
        return { columns: [], rows: [] };
      }

      // Infer columns from the first item
      const columns = Object.keys(items[0]).map((key) => ({
        name: key,
        type: typeof items[0][key],
      }));

      // Extract rows as arrays of values
      const rows = items.map((item) => Object.values(item));

      return { columns, rows };
    } catch (error) {
      console.error(`Error querying IndexedDB store "${query.query}":`, error);
      throw new Error(
        `Failed to query IndexedDB: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

// This map will hold instances of connected data sources
const activeConnections: Map<string, BaseConnector> = new Map();

// For local data sources, credentials are not typically managed in the same way as cloud services.
// We'll remove the secureCredentialManager as it's not applicable to local storage.

// Placeholder for data transformation logic
const dataTransformer = {
  applyTransformations(
    data: QueryResult,
    transformations: DataTransformation[],
  ): QueryResult {
    console.log('Applying transformations:', transformations);
    // Simulate applying transformations
    let transformedData = data;
    for (const transformation of transformations) {
      console.log(`Applying transformation: ${transformation.type}`);
      // Implement transformation logic based on transformation.type and transformation.config
      // This is a simplified placeholder
      if (transformation.type === 'filter') {
        // Example: filter rows based on a condition
        // transformedData.rows = transformedData.rows.filter(...)
      } else if (transformation.type === 'aggregate') {
        // Example: group and aggregate data
        // transformedData.rows = transformedData.rows.reduce(...)
      }
      // ... other transformation types
    }
    return transformedData;
  },
};

export const DataConnectorService = {
  async connect(connection: DataSourceConnection): Promise<void> {
    if (activeConnections.has(connection.id)) {
      console.log(`Connection ${connection.id} already active.`);
      return;
    }

    let connector: BaseConnector;
    // Retrieve credentials securely
    switch (connection.type) {
      case DataSourceType.LocalCSV:
        connector = new LocalCSVConnector();
        break;
      case DataSourceType.IndexedDB:
        connector = new IndexedDBConnector();
        break;
      default:
        throw new Error(`Unsupported data source type: ${connection.type}`);
    }

    try {
      await connector.connect(connection.connectionDetails);
      activeConnections.set(connection.id, connector);
      console.log(
        `Successfully established connection for ${connection.name} (${connection.type})`,
      );
    } catch (error) {
      console.error(
        `Failed to connect to ${connection.name} (${connection.type}):`,
        error,
      );
      throw error;
    }
  },

  async disconnect(connectionId: string): Promise<void> {
    const connector = activeConnections.get(connectionId);
    if (connector) {
      await connector.disconnect();
      activeConnections.delete(connectionId);
      console.log(`Disconnected from ${connectionId}`);
    } else {
      console.warn(`No active connection found for ID: ${connectionId}`);
    }
  },

  async executeQuery(query: DataQuery): Promise<QueryResult> {
    const connector = activeConnections.get(query.connectionId);
    if (!connector) {
      throw new Error(
        `No active connection found for ID: ${query.connectionId}`,
      );
    }

    try {
      const rawResult = await connector.executeQuery(query);
      // Apply transformations if any
      if (query.transformations && query.transformations.length > 0) {
        return dataTransformer.applyTransformations(
          rawResult,
          query.transformations,
        );
      }
      return rawResult;
    } catch (error) {
      console.error(
        `Failed to execute query for connection ID ${query.connectionId}:`,
        error,
      );
      throw error;
    }
  },

  subscribeToData(
    query: DataQuery,
    onData: (data: QueryResult) => void,
    onError: (error: unknown) => void,
  ): () => void {
    const connector = activeConnections.get(query.connectionId);
    if (!connector) {
      onError(
        new Error(`No active connection found for ID: ${query.connectionId}`),
      );
      return () => {}; // Return a no-op unsubscribe function
    }

    if (typeof connector.subscribe !== 'function') {
      onError(
        new Error(
          `Connector for ID ${query.connectionId} does not support streaming.`,
        ),
      );
      return () => {}; // Return a no-op unsubscribe function
    }

    try {
      // Apply transformations before sending data to the subscriber
      const transformedOnData = (rawData: QueryResult) => {
        if (query.transformations && query.transformations.length > 0) {
          const transformedData = dataTransformer.applyTransformations(
            rawData,
            query.transformations,
          );
          onData(transformedData);
        } else {
          onData(rawData);
        }
      };
      return connector.subscribe(query, transformedOnData, onError);
    } catch (error) {
      console.error(
        `Failed to subscribe to data for connection ID ${query.connectionId}:`,
        error,
      );
      onError(error);
      return () => {}; // Return a no-op unsubscribe function
    }
  },

  // Add methods for listing available data sources, managing connections, etc.
  listAvailableDataSources(): DataSourceType[] {
    // Return the list of supported local data source types
    return [DataSourceType.LocalCSV, DataSourceType.IndexedDB];
  },

  listActiveConnections(): DataSourceConnection[] {
    // This would require storing more than just the connector instance
    // For now, return a simplified list based on active connection IDs
    console.warn(
      "listActiveConnections is a placeholder and doesn't return full connection details.",
    );
    return Array.from(activeConnections.keys()).map((id) => ({
      id,
      name: `Connection ${id}`, // Placeholder name
      type: DataSourceType.Custom, // Placeholder type - ideally fetch actual type
      connectionDetails: {}, // Placeholder details
    }));
  },
};
