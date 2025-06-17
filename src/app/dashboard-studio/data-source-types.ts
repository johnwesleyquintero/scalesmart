// src/app/dashboard-studio/data-source-types.ts

export enum DataSourceType {
  Snowflake = 'snowflake',
  GoogleBigQuery = 'google-bigquery',
  AzureSynapseAnalytics = 'azure-synapse-analytics',
  Salesforce = 'salesforce',
  HubSpot = 'hubspot',
  GoogleAnalytics4 = 'google-analytics-4',
  FacebookAds = 'facebook-ads',
  GoogleAds = 'google-ads',
  Shopify = 'shopify',
  AmazonSellerCentral = 'amazon-seller-central',
  MongoDB = 'mongodb',
  Cassandra = 'cassandra',
  Custom = 'custom', // For self-service connectors
  Kafka = 'kafka', // Streaming data source
  Kinesis = 'kinesis', // Streaming data source
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
}

export interface QueryResult {
  columns: { name: string; type: string }[];
  headers: string[]; // Added headers property
  rows: Record<string, string | number | null>[]; // Changed rows type to be more flexible
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
