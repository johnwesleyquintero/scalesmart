'use client';

import { Toaster } from 'sonner';
import { useMemo, useState, useCallback } from 'react';
import type { Contact } from './types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useCRMData } from '@/hooks/use-crm-data';
import { AddCustomerTab } from './components/AddCustomerTab';
import { CustomerListTab } from './components/CustomerListTab';
import { CategoryManagementTab } from './components/CategoryManagementTab';
import { CommunicationLogsTab } from './components/CommunicationLogsTab';

export default function CRMComponent() {
  const {
    customers,
    hasAttemptedInitialLoad,
    categories,
    handleSaveCustomerAction,
    handleDeleteCustomerAction,
    handleCategoriesUpdateAction,
    handleCategorySuccessfullyDeletedAction,
    handleCategoryRenamedAction,
    handleCreateCommunicationLogAction,
    handleUpdateCommunicationLogAction,
    handleDeleteCommunicationLogAction,
  } = useCRMData();

  const [editingCustomer, setEditingCustomer] = useState<Contact | null>(null);

  const handleEditCustomer = useCallback((customer: Contact) => {
    setEditingCustomer(customer);
  }, []); // No dependencies as it only sets state

  const handleSaveCustomerAndClearEdit = useCallback(
    async (formData: Omit<Contact, 'id'>, customerToEdit: Contact | null) => {
      await handleSaveCustomerAction(formData, customerToEdit);
      setEditingCustomer(null); // Clear editing state after save
    },
    [handleSaveCustomerAction], // Dependency on handleSaveCustomerAction from useCRMData
  );

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold my-6 text-center text-foreground">
          CRM Dashboard
        </h1>
        <p className="text-lg text-muted-foreground text-center mb-8">
          Manage your customer relationships, track interactions, and organize
          contact information.
        </p>

        <Tabs defaultValue="add-customer" className="w-full">
          <TabsList className="mb-4 flex flex-wrap h-auto justify-start bg-muted">
            <TabsTrigger
              value="add-customer"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
            >
              Add Customer
            </TabsTrigger>
            <TabsTrigger
              value="customer-list"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
            >
              Customer List
            </TabsTrigger>
            <TabsTrigger
              value="categories"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
            >
              Categories
            </TabsTrigger>
            <TabsTrigger
              value="communication-logs"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
            >
              Communication Logs (Overall)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add-customer" className="space-y-4 mt-4">
            <AddCustomerTab
              categories={categories}
              handleSaveCustomerAction={handleSaveCustomerAndClearEdit}
            />
          </TabsContent>

          <TabsContent value="customer-list" className="space-y-4 mt-4">
            <CustomerListTab
              customers={customers}
              hasAttemptedInitialLoad={hasAttemptedInitialLoad}
              categories={categories}
              handleDeleteCustomerAction={handleDeleteCustomerAction}
              handleCreateCommunicationLogAction={
                handleCreateCommunicationLogAction
              }
              handleUpdateCommunicationLogAction={
                handleUpdateCommunicationLogAction
              }
              handleDeleteCommunicationLogAction={
                handleDeleteCommunicationLogAction
              }
              onEditCustomerAction={handleEditCustomer}
            />
          </TabsContent>

          <TabsContent value="categories" className="space-y-4 mt-4">
            <CategoryManagementTab
              categories={categories}
              customers={customers}
              handleCategoriesUpdateAction={handleCategoriesUpdateAction}
              handleCategorySuccessfullyDeletedAction={
                handleCategorySuccessfullyDeletedAction
              }
              handleCategoryRenamedAction={handleCategoryRenamedAction}
            />
          </TabsContent>

          <TabsContent value="communication-logs" className="space-y-4 mt-4">
            <CommunicationLogsTab customers={customers} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
