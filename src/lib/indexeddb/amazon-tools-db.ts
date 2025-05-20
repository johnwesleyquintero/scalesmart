import Dexie, { Table } from 'dexie';

export interface SavedCalculation {
  id?: number; // Primary key. Optional as it's auto-incremented
  calculationType: string; // e.g., 'acos', 'fba'
  calculationData: unknown; // Store the calculation data as JSON
  timestamp: Date;
}

export class AmazonToolsDB extends Dexie {
  // 'calculations' is added by dexie when the database is opened
  calculations!: Table<SavedCalculation>;

  constructor() {
    super('AmazonToolsDB');
    this.version(1).stores({
      calculations: '++id, calculationType, timestamp', // Primary key is auto-incremented
    });
  }
}

export const db = new AmazonToolsDB();
