import {
  setItem,
  getItem,
  deleteItem,
  getAllItemsFromStore,
} from '../indexeddb-service';
import type { Category, Contact, CommunicationLog } from '@/app/crm/types';

// --- Constants for CRM IndexedDB Store Names ---
const CRM_CONTACTS_STORE_NAME = 'crm-contacts';
const CRM_CATEGORIES_STORE_NAME = 'crm-categories';
const CRM_COMMUNICATION_LOGS_STORE_NAME = 'crm-communication-logs';

// --- Contact Operations ---

export async function createContact(
  contact: Omit<Contact, 'id'>,
): Promise<string> {
  const id = crypto.randomUUID(); // Generate a unique ID for the new contact
  const newContact: Contact = { ...contact, id };
  await setItem(CRM_CONTACTS_STORE_NAME, id, newContact);
  return id;
}

export async function updateContact(contact: Contact): Promise<void> {
  if (!contact.id) {
    throw new Error('Contact ID is required for update.');
  }
  await setItem(CRM_CONTACTS_STORE_NAME, contact.id, contact);
}

export async function deleteContact(id: string): Promise<void> {
  await deleteItem(CRM_CONTACTS_STORE_NAME, id);
}

export async function getAllContacts(): Promise<Contact[]> {
  return getAllItemsFromStore<Contact>(CRM_CONTACTS_STORE_NAME);
}

// --- Category Operations ---

export async function addCategory(
  category: Omit<Category, 'id'>,
): Promise<string> {
  const id = crypto.randomUUID(); // Generate a unique ID for the new category
  const newCategory: Category = { ...category, id };
  await setItem(CRM_CATEGORIES_STORE_NAME, id, newCategory);
  return id;
}

export async function updateCategory(category: Category): Promise<void> {
  if (!category.id) {
    throw new Error('Category ID is required for update.');
  }
  await setItem(CRM_CATEGORIES_STORE_NAME, category.id, category);
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteItem(CRM_CATEGORIES_STORE_NAME, id);
}

export async function getAllCategories(): Promise<Category[]> {
  return getAllItemsFromStore<Category>(CRM_CATEGORIES_STORE_NAME);
}

// --- Communication Log Operations ---

export async function createCommunicationLog(
  log: Omit<CommunicationLog, 'id'>,
): Promise<string> {
  const id = crypto.randomUUID(); // Generate a unique ID for the new log
  const newLog: CommunicationLog = { ...log, id };
  await setItem(CRM_COMMUNICATION_LOGS_STORE_NAME, id, newLog);
  return id;
}

export async function updateCommunicationLog(
  log: CommunicationLog,
): Promise<void> {
  if (!log.id) {
    throw new Error('Communication Log ID is required for update.');
  }
  await setItem(CRM_COMMUNICATION_LOGS_STORE_NAME, log.id, log);
}

export async function deleteCommunicationLog(
  id: string,
  customerId: string,
): Promise<void> {
  // For communication logs, we might need to consider how they are stored.
  // If they are stored directly under their own ID, then a simple delete by ID is fine.
  // If they are nested within a customer object, this would need a different approach.
  // Assuming they are top-level items with their own unique IDs.
  await deleteItem(CRM_COMMUNICATION_LOGS_STORE_NAME, id);
}
