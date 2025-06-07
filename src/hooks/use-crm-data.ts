/**
 * @file use-crm-data.ts
 * @description Custom React hook for managing CRM data (customers, categories, communication logs).
 * It handles data loading, saving, updating, and deleting operations with IndexedDB
 * and provides state management for the CRM application.
 */

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  createContact,
  updateContact,
  deleteContact,
  getAllContacts,
  addCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
  createCommunicationLog,
  updateCommunicationLog,
  deleteCommunicationLog,
} from '@/lib/indexeddb/crm-db';
import type { Category, Contact, CommunicationLog } from '@/app/crm/types';

/**
 * `useCRMData` is a custom hook that encapsulates the logic for managing CRM data.
 * It provides state variables for customers and categories, along with memoized
 * callback functions for performing CRUD operations and updating the state.
 */
export const useCRMData = () => {
  // State to store the list of customer contacts.
  const [customers, setCustomers] = useState<Contact[]>([]);
  // State to track if the initial data load from IndexedDB has been attempted.
  const [hasAttemptedInitialLoad, setHasAttemptedInitialLoad] = useState(false);
  // State to store the list of categories.
  const [categories, setCategories] = useState<Category[]>([]);

  /**
   * useEffect hook to load initial customer and category data from IndexedDB
   * when the component mounts. This ensures data persistence across sessions.
   */
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Fetch all contacts and map them to the Contact type, ensuring default values.
        const allContacts = await getAllContacts();
        const allCustomers: Contact[] = allContacts.map(
          (contact) =>
            ({
              ...contact,
              id: contact.id!, // Ensure ID is present as it's expected for existing contacts.
              category: contact.category || '', // Default category to empty string if null/undefined.
              communicationLogs: contact.communicationLogs || [], // Default logs to empty array.
            }) as Contact,
        );
        setCustomers(allCustomers);

        // Fetch all categories.
        const allCategories = await getAllCategories();
        setCategories(allCategories);
      } catch (error) {
        console.error('Error loading data from IndexedDB:', error);
        toast.error('Failed to load data. Please check console for details.');
      } finally {
        setHasAttemptedInitialLoad(true); // Mark initial load as attempted regardless of success.
      }
    };
    loadInitialData();
  }, []); // Empty dependency array ensures this effect runs only once on mount.

  /**
   * Callback function to handle saving a customer (either creating a new one or updating an existing one).
   * It uses `useCallback` to memoize the function, preventing unnecessary re-creations.
   * @param formData The data for the customer to be saved, without an ID if new.
   * @param editingCustomer The existing customer object if in edit mode, otherwise null.
   */
  const handleSaveCustomerAction = useCallback(
    async (formData: Omit<Contact, 'id'>, editingCustomer: Contact | null) => {
      if (editingCustomer) {
        // If `editingCustomer` exists, update the existing contact.
        const updatedCustomer: Contact = {
          ...formData,
          id: editingCustomer.id, // Retain the original ID for update.
        };
        try {
          await updateContact(updatedCustomer);
          setCustomers((prevCustomers) =>
            prevCustomers.map((customer: Contact) =>
              customer.id === editingCustomer.id
                ? {
                    ...customer,
                    ...updatedCustomer,
                    // Preserve existing communication logs as they are not part of the form data.
                    communicationLogs: customer.communicationLogs,
                  }
                : customer,
            ),
          );
          toast.success('Customer updated successfully!');
        } catch (error) {
          console.error('Error updating customer in IndexedDB:', error);
          toast.error(
            'Failed to update customer. Please check console for details.',
          );
        }
      } else {
        // If no `editingCustomer`, create a new contact.
        const newCustomer: Contact = {
          ...formData,
        };
        try {
          const newId = await createContact(newCustomer); // IndexedDB service returns the new ID.

          if (newId === undefined) {
            toast.error(
              'Failed to add customer. Please check console for details.',
            );
            return;
          }

          // Create a complete new customer object with the generated ID and default values.
          const completeNewCustomer = {
            ...newCustomer,
            id: newId,
            category: newCustomer.category || '', // Ensure category is an empty string if not set.
            communicationLogs: [], // New customers start with an empty array of logs.
          } as Contact;
          setCustomers((prevCustomers) => [
            ...prevCustomers,
            completeNewCustomer,
          ]);
          toast.success('Customer added successfully!');
        } catch (error) {
          console.error('Error adding customer to IndexedDB:', error);
          toast.error(
            'Failed to add customer. Please check console for details.',
          );
        }
      }
    },
    [], // No dependencies needed if using functional updates for setCustomers
  );

  const handleDeleteCustomerAction = useCallback(async (id: string) => {
    try {
      await deleteContact(id);
      setCustomers((prevCustomers) =>
        prevCustomers.filter((customer: Contact) => customer.id !== id),
      );
      toast.info('Customer deleted.');
    } catch (error) {
      console.error('Error deleting customer from IndexedDB:', error);
      toast.error('Failed to delete customer. See console for details.');
    }
  }, []);

  /**
   * Handles adding a new category.
   * Calls the IndexedDB service and updates the state.
   */
  const handleAddCategoryAction = useCallback(async (name: string) => {
    try {
      // The IndexedDB service handles ID generation
      const newId = await addCategory({ name });
      if (newId) {
        const newCategory: Category = { id: newId, name };
        setCategories((prevCategories) => [...prevCategories, newCategory]);
        toast.success('Category added successfully!');
      } else {
        toast.error('Failed to add category. Please check console for details.');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category. Please try again. Check console for details.');
    }
  }, []); // Dependency array is empty as it uses setCategories functional update

  /**
   * Handles updating an existing category.
   * Calls the IndexedDB service and updates the state.
   */
  const handleUpdateCategoryAction = useCallback(async (category: Category) => {
    try {
      await updateCategory(category);
      setCategories((prevCategories) =>
        prevCategories.map((cat) => (cat.id === category.id ? category : cat)),
      );
      toast.success('Category updated successfully!');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category. Please try again. Check console for details.');
    }
  }, []); // Dependency array is empty as it uses setCategories functional update

  /**
   * Handles deleting a category.
   * Calls the IndexedDB service and updates the state.
   */
  const handleDeleteCategoryAction = useCallback(async (id: string) => {
    try {
      await deleteCategory(id);
      setCategories((prevCategories) =>
        prevCategories.filter((cat) => cat.id !== id),
      );
      toast.success('Category deleted successfully!');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category. Please try again. Check console for details.');
    }
  }, []); // Dependency array is empty as it uses setCategories functional update

  const handleCategorySuccessfullyDeletedAction = useCallback(
    async (deletedCategoryName: string) => {
      const customersToUpdate = customers.filter(
        (customer) => customer.category === deletedCategoryName,
      );

      const updatePromises = customersToUpdate.map(async (customer) => {
        const updatedCustomer = { ...customer, category: '' };
        await updateContact(updatedCustomer);
        return updatedCustomer;
      });

      await Promise.all(updatePromises);

      setCustomers((prevCustomers) =>
        prevCustomers.map((customer) =>
          customer.category === deletedCategoryName
            ? { ...customer, category: '' }
            : customer,
        ),
      );
      toast.info(
        `Customers previously in "${deletedCategoryName}" are now uncategorized.`,
      );
    },
    [customers],
  );

  const handleCategoryRenamedAction = useCallback(
    async (oldName: string, newName: string) => {
      const customersToUpdate = customers.filter(
        (customer) => customer.category === oldName,
      );

      const updatePromises = customersToUpdate.map(async (customer) => {
        const updatedCustomer = { ...customer, category: newName };
        await updateContact(updatedCustomer);
        return updatedCustomer;
      });

      await Promise.all(updatePromises);

      setCustomers((prevCustomers) =>
        prevCustomers.map((customer) =>
          customer.category === oldName
            ? { ...customer, category: newName }
            : customer,
        ),
      );
      toast.info(
        `Customers previously in "${oldName}" are now in "${newName}".`,
      );
    },
    [customers],
  );

  const handleCreateCommunicationLogAction = useCallback(
    async (log: Omit<CommunicationLog, 'id'>) => {
      try {
        const newLogId = await createCommunicationLog(log);
        if (newLogId) {
          setCustomers((prevCustomers) =>
            prevCustomers.map((cust) =>
              cust.id === log.customerId
                ? {
                    ...cust,
                    communicationLogs: [
                      ...(cust.communicationLogs || []),
                      { ...log, id: newLogId },
                    ],
                  }
                : cust,
            ),
          );
          toast.success('Communication log created successfully!');
        }
      } catch (error) {
        console.error('Error creating communication log:', error);
        toast.error('Failed to create communication log. Please check console for details.');
      }
    },
    [],
  );

  /**
   * Helper function to update the communication logs for a specific customer in the state.
   * @param customerId The ID of the customer whose logs are being updated.
   * @param updateFn A function that takes the current logs array and returns the new logs array.
   */
  const updateCustomerCommunicationLogs = useCallback(
    (
      customerId: string,
      updateFn: (logs: CommunicationLog[]) => CommunicationLog[],
    ) => {
      setCustomers((prevCustomers) =>
        prevCustomers.map((cust) =>
          cust.id === customerId
            ? {
                ...cust,
                communicationLogs: updateFn(cust.communicationLogs || []),
              }
            : cust,
        ),
      );
    },
    [],
  );

  const handleUpdateCommunicationLogAction = useCallback(
    async (log: CommunicationLog) => {
      try {
        await updateCommunicationLog(log);
        updateCustomerCommunicationLogs(log.customerId, (logs) =>
          logs.map((existingLog) =>
            existingLog.id === log.id ? log : existingLog,
          ),
        );
        toast.success('Communication log updated successfully!');
      } catch (error) {
        console.error('Error updating communication log:', error);
        toast.error('Failed to update communication log. Please check console for details.');
      }
    },
    [updateCustomerCommunicationLogs],
  );

  const handleDeleteCommunicationLogAction = useCallback(
    async (logId: string, customerId: string) => {
      try {
        await deleteCommunicationLog(logId, customerId);
        updateCustomerCommunicationLogs(customerId, (logs) =>
          logs.filter((existingLog) => existingLog.id !== logId),
        );
        toast.info('Communication log deleted.');
      } catch (error) {
        console.error('Error deleting communication log:', error);
        toast.error('Failed to delete communication log. Please check console for details.');
      }
    },
    [updateCustomerCommunicationLogs],
  );

  return {
    customers,
    hasAttemptedInitialLoad,
    categories,
    handleSaveCustomerAction,
    handleDeleteCustomerAction,
    // Include new category action handlers
    handleAddCategoryAction,
    handleUpdateCategoryAction,
    handleDeleteCategoryAction,
    handleCategorySuccessfullyDeletedAction,
    handleCategoryRenamedAction,
    handleCreateCommunicationLogAction,
    handleUpdateCommunicationLogAction,
    handleDeleteCommunicationLogAction,
  };
};
