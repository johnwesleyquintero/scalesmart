import { db } from './indexeddb-service';
import type { Contact } from '@/app/crm/types';
import type { Category } from '@/types/indexeddb';

// Original Category interface (compatible with imported Category)
interface LocalCategory {
  id: string;
  name: string;
}

// Original Customer interface, will be mapped to Contact
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  category: string | null; // Mapped to category?: string in Contact
}

// Helper for logging errors consistently
function logError(error: unknown, message: string, operation: string) {
  console.error(`IndexedDB Operation Error (${operation}): ${message}`, error);
}

export const addCustomer = async (customer: Customer): Promise<void> => {
  const contactData: Contact = {
    id: customer.id || crypto.randomUUID(), // Ensure ID exists or generate
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    notes: customer.notes,
    category: customer.category === null ? undefined : customer.category,
    company: '', // Default for missing field in Customer interface
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastActivity: Date.now(),
  };
  try {
    await db.crmContacts.add(contactData);
  } catch (error) {
    logError(error, `Failed to add customer: ${customer.name}`, 'addCustomer');
    throw new Error('Failed to add customer');
  }
};

export const updateCustomer = async (customer: Customer): Promise<void> => {
  // Ensure the customer object conforms to Contact for updating
  // For a 'put' operation, it's best to provide the full object structure expected by the table
  // or fetch existing, merge, and then put.
  // This example assumes 'customer' can be safely cast or mapped.
  const contactData: Contact = {
    // Map all fields from Customer to Contact, ensuring required Contact fields are present
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    notes: customer.notes,
    category: customer.category === null ? undefined : customer.category,
    company: '', // Assuming default or fetch existing if this field should be preserved
    createdAt: Date.now(), // This should ideally be preserved from original record
    updatedAt: Date.now(),
    // lastActivity might also need to be preserved or updated
  };
  try {
    // Fetch existing contact to preserve fields not in Customer interface like createdAt, company
    const existingContact = await db.crmContacts.get(customer.id);
    if (!existingContact) {
      throw new Error(`Customer with id ${customer.id} not found for update.`);
    }
    const updatedContactData: Contact = {
      ...existingContact,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      notes: customer.notes,
      category: customer.category === null ? undefined : customer.category,
      updatedAt: Date.now(),
      lastActivity: Date.now(),
    };
    await db.crmContacts.put(updatedContactData);
  } catch (error) {
    logError(
      error,
      `Failed to update customer: ${customer.name}`,
      'updateCustomer',
    );
    throw new Error('Failed to update customer');
  }
};

export const deleteCustomer = async (id: string): Promise<void> => {
  try {
    await db.crmContacts.delete(id);
  } catch (error) {
    logError(
      error,
      `Failed to delete customer with id: ${id}`,
      'deleteCustomer',
    );
    throw new Error('Failed to delete customer');
  }
};

export const getCustomer = async (id: string): Promise<Contact | undefined> => {
  try {
    return await db.crmContacts.get(id);
  } catch (error) {
    logError(error, `Failed to get customer with id: ${id}`, 'getCustomer');
    throw new Error('Failed to get customer');
  }
};

export const getAllCustomers = async (): Promise<Contact[]> => {
  try {
    return await db.crmContacts.toArray();
  } catch (error) {
    logError(error, 'Failed to get all customers', 'getAllCustomers');
    throw new Error('Failed to get all customers');
  }
};

export const addCategory = async (category: LocalCategory): Promise<void> => {
  const categoryData: Category = {
    // Use the imported Category type
    id: category.id || crypto.randomUUID(),
    name: category.name,
  };
  try {
    await db.crmCategories.add(categoryData);
  } catch (error) {
    logError(error, `Failed to add category: ${category.name}`, 'addCategory');
    throw new Error('Failed to add category');
  }
};

export const updateCategory = async (
  category: LocalCategory,
): Promise<void> => {
  const categoryData: Category = {
    // Use the imported Category type
    id: category.id,
    name: category.name,
  };
  try {
    await db.crmCategories.put(categoryData);
  } catch (error) {
    logError(
      error,
      `Failed to update category: ${category.name}`,
      'updateCategory',
    );
    throw new Error('Failed to update category');
  }
};

export const deleteCategory = async (id: string): Promise<void> => {
  try {
    await db.crmCategories.delete(id);
  } catch (error) {
    logError(
      error,
      `Failed to delete category with id: ${id}`,
      'deleteCategory',
    );
    throw new Error('Failed to delete category');
  }
};

export const getCategory = async (
  id: string,
): Promise<Category | undefined> => {
  try {
    return await db.crmCategories.get(id);
  } catch (error) {
    logError(error, `Failed to get category with id: ${id}`, 'getCategory');
    throw new Error('Failed to get category');
  }
};

export const getAllCategories = async (): Promise<Category[]> => {
  try {
    return await db.crmCategories.toArray();
  } catch (error) {
    logError(error, 'Failed to get all categories', 'getAllCategories');
    throw new Error('Failed to get all categories');
  }
};

// These functions are not needed anymore, but we need to keep them to avoid errors
// Deprecated functions are removed as per refactoring plan.
// If they were truly needed for some obscure reason, they would be reimplemented
// using the new db instance or by calling generic helpers from indexeddb-service.ts.
// For this refactoring, they are considered obsolete.
