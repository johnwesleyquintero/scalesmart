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
  createCommunicationLog,
  updateCommunicationLog,
  deleteCommunicationLog,
} from '@/lib/indexeddb/crm-db'; // Updated import path to crm-db.ts
import type { Contact, CommunicationLog } from '@/app/crm/types';
import { useCrmCategories } from './use-crm-categories';
import { produce } from 'immer';
import {
  calculateLeadScore,
  getLeadScoreCategory,
} from '@/app/crm/utils/leadScoringUtils';
import { logActivity } from '@/app/crm/utils/activityLogger'; // Import the new activity logger

const LOAD_DATA_ERROR =
  'Failed to load data. Please check console for details.';
const UPDATE_CUSTOMER_ERROR =
  'Failed to update customer. Please check console for details.';
const ADD_CUSTOMER_ERROR =
  'Failed to add customer. Please check console for details.';
const DELETE_CUSTOMER_ERROR =
  'Failed to delete customer. Please check console for details.';
const CREATE_COMM_LOG_ERROR =
  'Failed to create communication log. Please check console for details.';
const UPDATE_COMM_LOG_ERROR =
  'Failed to update communication log. Please check console for details.';
const DELETE_COMM_LOG_ERROR =
  'Failed to delete communication log. Please check console for details.';

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

  const {
    categories,
    handleAddCategoryAction,
    handleUpdateCategoryAction,
    handleDeleteCategoryAction,
  } = useCrmCategories();

  /**
   * useEffect hook to load initial customer data from IndexedDB
   * when the component mounts. This ensures data persistence across sessions.
   */
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Fetch all contacts and map them to the Contact type, ensuring default values.
        const allContacts = await getAllContacts();
        const allCustomers: Contact[] = allContacts.map(
          (contact: Contact) =>
            ({
              ...contact,
              id: contact.id, // Ensure ID is present as it's expected for existing contacts.
              category: contact.category || '', // Default category to empty string if null/undefined.
              communicationLogs: contact.communicationLogs || [], // Default logs to empty array.
            }) as Contact,
        );
        setCustomers(allCustomers);
      } catch (error: unknown) {
        console.error('Error loading data from IndexedDB:', error);
        toast.error(`${LOAD_DATA_ERROR} ${(error as Error).message || error}`);
      } finally {
        setHasAttemptedInitialLoad(true); // Mark initial load as attempted regardless of success.
      }
    };
    loadInitialData();
  }, []);

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
          lastContacted: editingCustomer.lastContacted, // Preserve existing lastContacted
          communicationLogs: editingCustomer.communicationLogs, // Preserve existing communication logs
          lastActivity: Date.now(), // Update lastActivity on customer update
        };

        // Calculate lead score and category for the updated customer
        updatedCustomer.leadScore = calculateLeadScore(updatedCustomer);
        updatedCustomer.leadScoreCategory = getLeadScoreCategory(
          updatedCustomer.leadScore,
        );

        try {
          await updateContact(updatedCustomer);
          setCustomers(
            produce((draftCustomers: Contact[]) => {
              const index = draftCustomers.findIndex(
                (customer: Contact) => customer.id === editingCustomer.id,
              );
              if (index !== -1) {
                draftCustomers[index] = {
                  ...draftCustomers[index],
                  ...updatedCustomer,
                };
              }
            }),
          );
          toast.success('Customer updated successfully!');
          // Log activity for customer update
          await logActivity(
            updatedCustomer.id,
            'customer_updated',
            `Customer "${updatedCustomer.name}" was updated.`,
          );
        } catch (error: unknown) {
          console.error('Error updating customer in IndexedDB:', error);
          toast.error(
            `${UPDATE_CUSTOMER_ERROR} ${(error as Error).message || error}`,
          );
        }
      } else {
        // If no `editingCustomer`, create a new contact.
        const newCustomerData: Omit<
          Contact,
          'id' | 'createdAt' | 'updatedAt' | 'lastContacted'
        > = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          notes: formData.notes,
          category: formData.category,
          address: formData.address,
          salesStage: formData.salesStage, // Include salesStage
          communicationLogs: formData.communicationLogs,
        };
        try {
          const newId = await createContact(newCustomerData); // IndexedDB service returns the new ID.

          if (newId === undefined) {
            toast.error(
              'Failed to add customer. Please check console for details.',
            );
            return;
          }

          // Create a complete new customer object with the generated ID and default values.
          const completeNewCustomer = {
            ...newCustomerData,
            id: newId,
            category: newCustomerData.category || '', // Ensure category is an empty string if not set.
            salesStage: newCustomerData.salesStage || 'Lead', // Ensure salesStage is 'Lead' if not set.
            communicationLogs: [], // New customers start with an empty array of logs.
            createdAt: Date.now(), // Set creation timestamp
            updatedAt: Date.now(), // Set update timestamp
            lastActivity: Date.now(), // Set lastActivity on new customer creation
          } as Contact;

          // Calculate lead score and category for the new customer
          completeNewCustomer.leadScore =
            calculateLeadScore(completeNewCustomer);
          completeNewCustomer.leadScoreCategory = getLeadScoreCategory(
            completeNewCustomer.leadScore,
          );

          setCustomers(
            produce((draftCustomers: Contact[]) => {
              draftCustomers.push(completeNewCustomer);
            }),
          );
          toast.success('Customer added successfully!');
          // Log activity for new customer creation
          await logActivity(
            completeNewCustomer.id,
            'customer_created',
            `New customer "${completeNewCustomer.name}" was created.`,
          );
        } catch (error: unknown) {
          console.error('Error adding customer to IndexedDB:', error);
          toast.error(
            `${ADD_CUSTOMER_ERROR} ${(error as Error).message || error}`,
          );
        }
      }
    },
    [],
  );

  const handleDeleteCustomerAction = useCallback(async (id: string) => {
    try {
      await deleteContact(id);
      setCustomers(
        produce((draftCustomers: Contact[]) => {
          return draftCustomers.filter(
            (customer: Contact) => customer.id !== id,
          );
        }),
      );
      toast.info('Customer deleted.');
      // Log activity for customer deletion
      await logActivity(
        id,
        'customer_deleted',
        `Customer with ID "${id}" was deleted.`,
      );
    } catch (error: unknown) {
      console.error('Error deleting customer from IndexedDB:', error);
      toast.error(
        `${DELETE_CUSTOMER_ERROR} ${(error as Error).message || error}`,
      );
    }
  }, []);

  const handleCategorySuccessfullyDeletedAction = useCallback(
    async (deletedCategoryName: string) => {
      const customersToUpdate = customers.filter(
        (customer: Contact) => customer.category === deletedCategoryName,
      );

      const updatePromises = customersToUpdate.map(
        async (customer: Contact) => {
          const updatedCustomer = { ...customer, category: '' };
          await updateContact(updatedCustomer);
          return updatedCustomer;
        },
      );

      await Promise.all(updatePromises);

      setCustomers(
        produce((draftCustomers: Contact[]) =>
          draftCustomers.map((customer: Contact) =>
            customer.category === deletedCategoryName
              ? { ...customer, category: '' }
              : customer,
          ),
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
        (customer: Contact) => customer.category === oldName,
      );

      const updatePromises = customersToUpdate.map(
        async (customer: Contact) => {
          const updatedCustomer = { ...customer, category: newName };
          await updateContact(updatedCustomer);
          return updatedCustomer;
        },
      );

      await Promise.all(updatePromises);

      setCustomers(
        produce((draftCustomers: Contact[]) =>
          draftCustomers.map((customer: Contact) =>
            customer.category === oldName
              ? { ...customer, category: newName }
              : customer,
          ),
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
          setCustomers(
            produce((draftCustomers: Contact[]) => {
              draftCustomers.map((cust: Contact) =>
                cust.id === log.customerId
                  ? {
                      ...cust,
                      communicationLogs: [
                        ...(cust.communicationLogs || []),
                        { ...log, id: newLogId },
                      ],
                      lastContacted: Date.now(), // Update lastContacted timestamp
                      lastActivity: Date.now(), // Update lastActivity on communication log creation
                    }
                  : cust,
              );
            }),
          );
          toast.success('Communication log created successfully!');
          // Log activity for communication log creation
          await logActivity(
            log.customerId,
            'communication_logged',
            `New communication log for "${log.customerId}" (Type: ${log.type}, Subject: ${log.subject || 'N/A'}).`,
          );
        }
      } catch (error: unknown) {
        console.error('Error creating communication log:', error);
        toast.error(
          `${CREATE_COMM_LOG_ERROR} ${(error as Error).message || error}`,
        );
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
      setCustomers(
        produce((draftCustomers: Contact[]) =>
          draftCustomers.map((cust: Contact) =>
            cust.id === customerId
              ? {
                  ...cust,
                  communicationLogs: updateFn(cust.communicationLogs || []),
                  lastActivity: Date.now(), // Update lastActivity on communication log update/delete
                }
              : cust,
          ),
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
        // Log activity for communication log update
        await logActivity(
          log.customerId,
          'communication_updated',
          `Communication log for "${log.customerId}" (ID: ${log.id}) was updated.`,
        );
      } catch (error: unknown) {
        console.error('Error updating communication log:', error);
        toast.error(
          `${UPDATE_COMM_LOG_ERROR} ${(error as Error).message || error}`,
        );
      }
    },
    [updateCustomerCommunicationLogs],
  );

  const handleDeleteCommunicationLogAction = useCallback(
    async (logId: string, customerId: string) => {
      try {
        await deleteCommunicationLog(logId);
        updateCustomerCommunicationLogs(customerId, (logs) =>
          logs.filter((existingLog) => existingLog.id !== logId),
        );
        toast.info('Communication log deleted.');
        // Log activity for communication log deletion
        await logActivity(
          customerId,
          'communication_deleted',
          `Communication log with ID "${logId}" for customer "${customerId}" was deleted.`,
        );
      } catch (error: unknown) {
        console.error('Error deleting communication log:', error);
        toast.error(
          `${DELETE_COMM_LOG_ERROR} ${(error as Error).message || error}`,
        );
      }
    },
    [updateCustomerCommunicationLogs],
  );

  const crmCategories = useCrmCategories();

  return {
    customers,
    hasAttemptedInitialLoad,
    handleSaveCustomerAction,
    handleDeleteCustomerAction,
    handleCategorySuccessfullyDeletedAction,
    handleCategoryRenamedAction,
    handleCreateCommunicationLogAction,
    handleUpdateCommunicationLogAction,
    handleDeleteCommunicationLogAction,
    ...crmCategories,
  };
};
