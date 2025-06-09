import {
  setItem,
  getItem, // Although not used in the original code, including it for completeness if needed by derived services.
  deleteItem,
  getAllItemsFromStore,
} from '../indexeddb-service'; // Assuming this service exists and works as intended.
import type {
  Category,
  Contact,
  CommunicationLog,
  ActivityLog,
} from '@/app/crm/types';

// --- Constants for CRM IndexedDB Store Names ---
const CRM_CONTACTS_STORE_NAME = 'crm-contacts';
const CRM_CATEGORIES_STORE_NAME = 'crm-categories';
const CRM_COMMUNICATION_LOGS_STORE_NAME = 'crm-communication-logs';
const CRM_ACTIVITY_LOGS_STORE_NAME = 'crm-activity-logs'; // New store for activity logs

// --- Generic CRUD Service Factory ---

/**
 * Creates a generic CRUD service for a given IndexedDB store.
 * @param storeName The name of the IndexedDB store.
 * @returns An object containing CRUD operations (create, update, delete, getAll).
 */
export function createCrudService<T extends { id: string }>(storeName: string) {
  return {
    /**
     * Creates a new item in the store.
     * @param item - The item data, excluding the ID.
     * @returns A promise resolving with the ID of the newly created item.
     */
    create: async (item: Omit<T, 'id'>): Promise<string> => {
      const id = crypto.randomUUID(); // Generate a unique ID
      const newItem: T = { ...item, id } as T; // Add the generated ID
      await setItem(storeName, id, newItem);
      return id;
    },

    /**
     * Updates an existing item in the store.
     * @param item - The item data, including the ID.
     * @returns A promise that resolves when the update is complete.
     * @throws Error if the item ID is missing.
     */
    update: async (item: T): Promise<void> => {
      if (!item.id) {
        throw new Error(
          `ID is required for updating an item in store "${storeName}".`,
        );
      }
      await setItem(storeName, item.id, item);
    },

    /**
     * Deletes an item from the store by its ID.
     * @param id - The ID of the item to delete.
     * @returns A promise that resolves when the deletion is complete.
     */
    delete: async (id: string): Promise<void> => {
      await deleteItem(storeName, id);
    },

    /**
     * Retrieves all items from the store.
     * @returns A promise resolving with an array of all items in the store.
     */
    getAll: async (): Promise<T[]> => {
      return getAllItemsFromStore<T>(storeName);
    },

    // Optional: Add a getItemById function if needed
    // getById: async (id: string): Promise<T | undefined> => {
    //   return getItem<T>(storeName, id);
    // },
  };
}

// --- Type-Specific CRM Operations ---

export const contactService = createCrudService<Contact>(
  CRM_CONTACTS_STORE_NAME,
);
export const categoryService = createCrudService<Category>(
  CRM_CATEGORIES_STORE_NAME,
);
export const communicationLogService = createCrudService<CommunicationLog>(
  CRM_COMMUNICATION_LOGS_STORE_NAME,
);

export const activityLogService = createCrudService<ActivityLog>(
  CRM_ACTIVITY_LOGS_STORE_NAME,
);

// Export specific functions for easier import if preferred, linking to the service methods
export const createContact = contactService.create;
export const updateContact = contactService.update;
export const deleteContact = contactService.delete;
export const getAllContacts = contactService.getAll;

export const addCategory = categoryService.create; // Renamed 'create' to 'add' as in original
export const updateCategory = categoryService.update;
export const deleteCategory = categoryService.delete;
export const getAllCategories = categoryService.getAll;

export const createCommunicationLog = communicationLogService.create;
export const updateCommunicationLog = communicationLogService.update;
// Note: The original deleteCommunicationLog had two parameters (id, customerId) but only used id.
// The generic service deletes by id. If customerId logic is needed, a specific function outside the
// generic service or a more complex service might be required.
export const deleteCommunicationLog = communicationLogService.delete;
export const getAllCommunicationLogs = communicationLogService.getAll;

export const createActivityLog = activityLogService.create;
export const updateActivityLog = activityLogService.update;
export const deleteActivityLog = activityLogService.delete;
export const getAllActivityLogs = activityLogService.getAll;
