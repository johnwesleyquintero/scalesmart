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
          setCustomers(
            customers.map((customer: Customer) =>
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
          setCustomers([...customers, completeNewCustomer]);
          toast.success('Customer added successfully!');
        } catch (error) {
          console.error('Error adding customer to IndexedDB:', error);
          toast.error('Failed to add customer. See console for details.');
        }
      }
    },
    [customers],
  );

  const handleDeleteCustomer = useCallback(async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
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
    }
  }, []);

  const handleCategoriesUpdate = useCallback(
    (updatedCategories: Category[]) => {
      setCategories(updatedCategories);
    },
    [],
  );

  const handleCategorySuccessfullyDeleted = useCallback(
    async (deletedCategoryName: string) => {
      const customersToUpdate = customers.filter(
        (customer) => customer.category === deletedCategoryName,
      );

      const updatePromises = customersToUpdate.map(async (customer) => {
        const updatedCustomer = { ...customer, category: '' };
        await updateContact(updatedCustomer);
        return updatedCustomer;
      });

      const updatedCustomers = await Promise.all(updatePromises);

      setCustomers((prevCustomers) =>
        prevCustomers.map(
          (customer) =>
            updatedCustomers.find((uc) => uc.id === customer.id) || customer,
        ),
      );
      toast.info(
        `Customers previously in "${deletedCategoryName}" are now uncategorized.`,
      );
    },
    [customers],
  );

  const handleCategoryRenamed = useCallback(
    async (oldName: string, newName: string) => {
      const customersToUpdate = customers.filter(
        (customer) => customer.category === oldName,
      );

      const updatePromises = customersToUpdate.map(async (customer) => {
        const updatedCustomer = { ...customer, category: newName };
        await updateContact(updatedCustomer);
        return updatedCustomer;
      });

      const updatedCustomers = await Promise.all(updatePromises);

      setCustomers((prevCustomers) =>
        prevCustomers.map(
          (customer) =>
            updatedCustomers.find((uc) => uc.id === customer.id) || customer,
        ),
      );
      toast.info(
        `Customers previously in "${oldName}" are now in "${newName}".`,
      );
    },
    [customers],
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
