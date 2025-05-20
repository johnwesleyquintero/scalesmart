import Dexie, { Table } from 'dexie';

export interface AmazonToolData {
  // Define your data structures here, e.g.:
  id: number;
  calculationName: string;
  calculationData: unknown;
}

export interface CalculationData {
  id?: number;
  campaignName: string;
  adSpend: number;
  sales: number;
  acos: number;
  roas: number;
  date: Date;
}

class AmazonToolsDB extends Dexie {
  calculations!: Table<CalculationData, number>;

  constructor() {
    super('AmazonToolsDB');
    this.version(1).stores({
      calculations: '++id, campaignName, date',
    });
  }
}

export const db = new AmazonToolsDB();

export async function saveCalculation(data: CalculationData): Promise<number> {
  return db.calculations.add(data);
}

export async function getCalculations(): Promise<CalculationData[]> {
  return db.calculations.toArray();
}

export async function setItem(storeName: string, key: string, value: unknown): Promise<void> {
  try {
    await db.transaction('rw', db.calculations, async () => {
      await db.table(storeName).put({ key, value });
    });
  } catch (error) {
    console.error('Error setting item in IndexedDB:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

export async function getItem(storeName: string, key: string): Promise<unknown | undefined> {
  try {
    const result = await db.table(storeName).get(key);
    return result?.value;
  } catch (error) {
    console.error('Error getting item from IndexedDB:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
}
