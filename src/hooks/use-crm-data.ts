import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  createContact,
  updateContact,
  deleteContact,
  getAllContacts,
  getAllCategories,
  updateCategory,
  createCommunicationLog,
  updateCommunicationLog,
  deleteCommunicationLog,
} from '@/lib/indexeddb-service';
import type {
  Category,
  Contact,
  Customer,
  CommunicationLog,
} from '@/app/crm/types';

export const useCRMData = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [hasAttemptedInitialLoad, setHasAttemptedInitialLoad] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const allContacts = await getAllContacts();
        const allCustomers: Customer[] = allContacts.map(
          (contact) =>
            ({
              ...contact,
              id: contact.id!,
              category: contact.category || '',
              communicationLogs: contact.communicationLogs || [],
            }) as Customer,
        );
        setCustomers(allCustomers);

        const allCategories = await getAllCategories();
        setCategories(allCategories);
      } catch (error) {
        console.error('Error loading data from IndexedDB:', error);
        toast.error('Failed to load data. See console for details.');
      } finally {
        setHasAttemptedInitialLoad(true);
      }
    };
    loadInitialData();
  }, []);

  const handleSaveCustomer = useCallback(
    async (formData: Omit<Contact, 'id'>, editingCustomer: Customer | null) => {
      if (editingCustomer) {
        const updatedCustomer: Contact = {
          ...formData,
          id: editingCustomer.id,
        };
        try {
          await updateContact(updatedCustomer);
          setCustomers((prevCustomers) =>
            prevCustomers.map((customer: Customer) =>
              customer.id === editingCustomer.id
                ? {
                    ...customer,
                    ...updatedCustomer,
                    communicationLogs: customer.communicationLogs,
                  }
                : customer,
            ),
          );
          toast.success('Customer updated successfully!');
        } catch (error) {
          console.error('Error updating customer in IndexedDB:', error);
          toast.error('Failed to update customer. See console for details.');
        }
      } else {
        const newCustomer: Contact = {
          ...formData,
        };
        try {
          const newId = await createContact(newCustomer);

          if (newId === undefined) {
            toast.error('Failed to add customer. See console for details.');
            return;
          }

          const completeNewCustomer = {
            ...newCustomer,
            id: newId,
            category: newCustomer.category || '',
            communicationLogs: [],
          } as Customer;
          setCustomers((prevCustomers) => [
            ...prevCustomers,
            completeNewCustomer,
          ]);
          toast.success('Customer added successfully!');
        } catch (error) {
          console.error('Error adding customer to IndexedDB:', error);
          toast.error('Failed to add customer. See console for details.');
        }
      }
    },
    [], // No dependencies needed if using functional updates for setCustomers
  );

  const handleDeleteCustomer = useCallback(async (id: string) => {
    try {
      await deleteContact(id);
      setCustomers((prevCustomers) =>
        prevCustomers.filter((customer: Customer) => customer.id !== id),
      );
      toast.info('Customer deleted.');
    } catch (error) {
      console.error('Error deleting customer from IndexedDB:', error);
      toast.error('Failed to delete customer. See console for details.');
    }
  }, []);

  const handleCategoriesUpdate = useCallback(
    async (updatedCategories: Category[]) => {
      try {
        // Persist each category to IndexedDB
        for (const category of updatedCategories) {
          await updateCategory(category); // updateCategory uses put, which handles both add and update
        }
        setCategories(updatedCategories);
        toast.success('Categories updated successfully!');
      } catch (error) {
        console.error('Error updating categories in IndexedDB:', error);
        toast.error('Failed to save categories. See console for details.');
      }
    },
    [],
  );

  const handleCategorySuccessfullyDeleted = useCallback(
    async (deletedCategoryName: string) => {
      setCustomers((prevCustomers) => {
        const customersToUpdate = prevCustomers.filter(
          (customer) => customer.category === deletedCategoryName,
        );

        // Perform async updates in the background
        customersToUpdate.forEach(async (customer) => {
          const updatedCustomer = { ...customer, category: '' };
          await updateContact(updatedCustomer);
        });

        toast.info(
          `Customers previously in "${deletedCategoryName}" are now uncategorized.`,
        );
        return prevCustomers.map((customer) =>
          customer.category === deletedCategoryName
            ? { ...customer, category: '' }
            : customer,
        );
      });
    },
    [], // No dependencies needed if using functional updates for setCustomers
  );

  const handleCategoryRenamed = useCallback(
    async (oldName: string, newName: string) => {
      setCustomers((prevCustomers) => {
        const customersToUpdate = prevCustomers.filter(
          (customer) => customer.category === oldName,
        );

        // Perform async updates in the background
        customersToUpdate.forEach(async (customer) => {
          const updatedCustomer = { ...customer, category: newName };
          await updateContact(updatedCustomer);
        });

        toast.info(
          `Customers previously in "${oldName}" are now in "${newName}".`,
        );
        return prevCustomers.map((customer) =>
          customer.category === oldName
            ? { ...customer, category: newName }
            : customer,
        );
      });
    },
    [], // No dependencies needed if using functional updates for setCustomers
  );

  const handleCreateCommunicationLog = useCallback(
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
        toast.error('Failed to create communication log.');
      }
    },
    [],
  );

  const handleUpdateCommunicationLog = useCallback(
    async (log: CommunicationLog) => {
      try {
        await updateCommunicationLog(log);
        setCustomers((prevCustomers) =>
          prevCustomers.map((cust) =>
            cust.id === log.customerId
              ? {
                  ...cust,
                  communicationLogs: (cust.communicationLogs || []).map(
                    (existingLog) =>
                      existingLog.id === log.id ? log : existingLog,
                  ),
                }
              : cust,
          ),
        );
        toast.success('Communication log updated successfully!');
      } catch (error) {
        console.error('Error updating communication log:', error);
        toast.error('Failed to update communication log.');
      }
    },
    [],
  );

  const handleDeleteCommunicationLog = useCallback(
    async (logId: string, customerId: string) => {
      try {
        await deleteCommunicationLog(logId, customerId);
        setCustomers((prevCustomers) =>
          prevCustomers.map((cust) =>
            cust.id === customerId
              ? {
                  ...cust,
                  communicationLogs: (cust.communicationLogs || []).filter(
                    (existingLog) => existingLog.id !== logId,
                  ),
                }
              : cust,
          ),
        );
        toast.info('Communication log deleted.');
      } catch (error) {
        console.error('Error deleting communication log:', error);
        toast.error('Failed to delete communication log.');
      }
    },
    [],
  );

  return {
    customers,
    hasAttemptedInitialLoad,
    categories,
    handleSaveCustomer,
    handleDeleteCustomer,
    handleCategoriesUpdate,
    handleCategorySuccessfullyDeleted,
    handleCategoryRenamed,
    handleCreateCommunicationLog,
    handleUpdateCommunicationLog,
    handleDeleteCommunicationLog,
  };
};
