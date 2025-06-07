import Dexie, { Table } from 'dexie';
import type {
  CsvColumnMapping,
  ColumnTransformationRules,
} from '../../../types/data-mapping';
import type { DashboardMetrics } from '../../amazon-tools/types';

// Define the schema for the userCsvMappings store
interface UserCsvMappingRecord {
  toolName: string; // Primary key
  mapping: CsvColumnMapping;
  transformations?: Record<
    keyof DashboardMetrics,
    ColumnTransformationRules | undefined
  >;
  timestamp: Date; // To track when the mapping was last saved
}

// Define the database
export class AmazonToolsDexie extends Dexie {
  // Declare tables by extending Dexie.Table<Type of contents, Type of primary key>
  userCsvMappings!: Table<UserCsvMappingRecord, string>;

  constructor() {
    // Database name and version
    super('AmazonToolsDB');

    // Define schema for version 1
    this.version(1).stores({
      // 'toolName' is the primary key (indexed and unique)
      // 'mapping' and 'transformations' are indexed for querying, but not unique
      userCsvMappings: 'toolName, mapping, transformations, timestamp',
    });

    // Future versions would go here:
    // this.version(2).stores({ ... });
  }
}

// Create an instance of the database
export const db = new AmazonToolsDexie();

// Optional: Add a listener for database open success
db.on('ready', () => {
  console.log('AmazonToolsDB opened successfully.');
});

// Optional: Add a listener for database errors
db.on('versionchange', (event) => {
  console.warn(
    `Database version change detected. Old version: ${event.oldVersion}, New version: ${event.newVersion}. Please refresh the page.`,
  );
  // You might want to show a user-friendly message prompting them to refresh
});

db.on('populate', () => {
  console.log('AmazonToolsDB populated.');
});

db.on('blocked', (event) => {
  console.warn(
    `Database blocked: ${event.oldVersion} -> ${event.newVersion}. Please close other tabs.`,
  );
});
