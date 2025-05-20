// src/lib/indexeddb/amazon-tools-db.ts

import Dexie, { Table } from 'dexie';

export interface SavedCalculation {
  id?: number; // Primary key. Optional as it's auto-incremented.
  calculationType: string; // e.g., 'acos', 'profitMargin'
  data: any; // Store calculation data as JSON
  timestamp: Date;
  // Add more fields as needed, e.g., campaignName, productId
}

export class AmazonToolsDB extends Dexie {
  // 'calculations' is added by dexie when declaring the Table
  calculations!: Table<SavedCalculation, number>; // number = type of the primkey

  constructor() {
    super('AmazonToolsDB');
    this.version(1).stores({
      calculations: '++id, calculationType, timestamp', // Primary key is auto-incremented
    });
  }
}

export const db = new AmazonToolsDB();
