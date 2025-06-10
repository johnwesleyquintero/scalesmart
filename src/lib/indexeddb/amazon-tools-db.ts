// src/lib/indexeddb/amazon-tools-db.ts

import { openDB, IDBPDatabase } from 'idb';
import { AmazonReport } from '@/types/indexeddb';

const DB_NAME = 'amazonToolsDB';
const DB_VERSION = 1;
const STORE_NAME = 'amazonReports';

interface AmazonToolsDB extends IDBPDatabase {
  amazonReports: {
    key: string;
    value: AmazonReport;
  };
}

/**
 * Initializes and opens the IndexedDB database for Amazon Seller Tools.
 * Creates the 'amazonReports' object store if it doesn't exist.
 * @returns A promise that resolves to the IndexedDB database instance.
 */
export const initAmazonToolsDB = async (): Promise<
  IDBPDatabase<AmazonToolsDB>
> => {
  return openDB<AmazonToolsDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
      }
    },
  });
};

/**
 * Adds a new Amazon report to the database.
 * @param report The AmazonReport object to add.
 * @returns A promise that resolves to the ID of the added report.
 */
export const addAmazonReport = async (
  report: AmazonReport,
): Promise<string> => {
  const db = await initAmazonToolsDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const id = await tx.store.add(report);
  await tx.done;
  return id as string;
};

/**
 * Retrieves all Amazon reports from the database.
 * @returns A promise that resolves to an array of AmazonReport objects.
 */
export const getAllAmazonReports = async (): Promise<AmazonReport[]> => {
  const db = await initAmazonToolsDB();
  return db.getAll(STORE_NAME);
};

/**
 * Deletes an Amazon report from the database by its ID.
 * @param id The ID of the report to delete.
 * @returns A promise that resolves when the report is deleted.
 */
export const deleteAmazonReport = async (id: string): Promise<void> => {
  const db = await initAmazonToolsDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.delete(id);
  await tx.done;
};

/**
 * Updates an existing Amazon report in the database.
 * @param report The AmazonReport object to update (must have an ID).
 * @returns A promise that resolves when the report is updated.
 */
export const updateAmazonReport = async (
  report: AmazonReport,
): Promise<void> => {
  if (!report.id) {
    throw new Error('Report must have an ID to be updated.');
  }
  const db = await initAmazonToolsDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.put(report);
  await tx.done;
};
