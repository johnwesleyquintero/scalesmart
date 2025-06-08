'use client';

import { Toaster } from 'sonner';
import { useState, useCallback } from 'react';
import type { Contact } from './types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCRMData } from '@/hooks/use-crm-data';
import { AddCustomerTab } from './components/AddCustomerTab';
import CustomerEditModal from './components/CustomerEditModal';
import { CustomerListTab } from './components/CustomerListTab';
import { CategoryManagementTab } from './components/CategoryManagementTab';
import { CommunicationLogsTab } from './components/CommunicationLogsTab';

/**
 * CRMComponent is the main page component for the CRM dashboard.
 * It orchestrates the various CRM functionalities, including customer management,
 * category management, and communication logs, by utilizing the `useCRMData` hook
 * and rendering different tabs.
 */
export default function CRMComponent() {
  // Destructure CRM data and actions from the custom hook
  const {
    customers, // Array of customer contact objects.
    hasAttemptedInitialLoad, // Boolean indicating if initial data load is complete.
    categories, // Array of category objects.
    handleSaveCustomerAction, // Function to save (add or update) a customer.
    handleDeleteCustomerAction, // Function to delete a customer.
    // Destructure new category action handlers
    handleAddCategoryAction, // Function to add a new category.
    handleUpdateCategoryAction, // Function to update an existing category.
    handleDeleteCategoryAction, // Function to delete a category.
    handleCategorySuccessfullyDeletedAction, // Callback after a category is successfully deleted.
    handleCategoryRenamedAction, // Callback after a category is renamed.
    handleCreateCommunicationLogAction, // Function to create a new communication log.
    handleUpdateCommunicationLogAction, // Function to update an existing communication log.
    handleDeleteCommunicationLogAction, // Function to delete a communication log.
  } = useCRMData();

  // State to manage which customer is currently being edited.
  // When a customer object is set, the edit modal opens.
  const [editingCustomer, setEditingCustomer] = useState<Contact | null>(null);

  /**
   * Callback function to set the customer object that should be edited.
   * Setting this state opens the customer edit modal.
   * Memoized with useCallback to prevent unnecessary re-creations of the function.
   */
  const handleEditCustomer = useCallback((customer: Contact) => {
    setEditingCustomer(customer);
  }, []); // Empty dependency array means this function is created once.

  /**
   * Callback function to clear the editing customer state.
   * This function is used to close the customer edit modal.
   * Memoized with useCallback for performance.
   */
  const handleCancelEdit = useCallback(() => {
    setEditingCustomer(null);
  }, []); // Empty dependency array means this function is created once.

  /**
   * Callback function to handle saving a customer (either adding a new one or updating an existing one)
   * and then clearing the editing state to close the modal.
   * It calls the `handleSaveCustomerAction` from the hook and then resets the `editingCustomer` state.
   * Memoized with useCallback, depending on `handleSaveCustomerAction` to ensure it's updated
   * if the underlying save logic changes.
   */
  const handleSaveCustomerAndClearEdit = useCallback(
    async (formData: Omit<Contact, 'id'>, customerToEdit: Contact | null) => {
      await handleSaveCustomerAction(formData, customerToEdit);
      setEditingCustomer(null); // Clear editing state after save
    },
    [handleSaveCustomerAction], // Dependency array includes the save action from the hook.
  );

  return (
    <>
      {/* Toaster component for displaying notifications (e.g., success or error messages) */}
      <Toaster position="top-right" richColors />
      <div className="container mx-auto p-4">
        {/* Page Header */}
        <h1 className="text-3xl font-bold my-6 text-center text-foreground">
          CRM Dashboard
        </h1>
        <p className="text-lg text-muted-foreground text-center mb-8">
          Manage your customer relationships, track interactions, and organize
          contact information.
        </p>

        {/* Main Tabs Navigation */}
        {/* Provides navigation between different sections of the CRM dashboard. */}
        <Tabs defaultValue="add-customer" className="w-full">
          <TabsList className="mb-4 flex flex-wrap h-auto justify-start bg-muted">
            <CRMTabsTrigger value="add-customer">Add Customer</CRMTabsTrigger>
            <CRMTabsTrigger value="customer-list">Customer List</CRMTabsTrigger>
            <CRMTabsTrigger value="categories">Categories</CRMTabsTrigger>
            <CRMTabsTrigger value="communication-logs">
              Communication Logs (Overall)
            </CRMTabsTrigger>
          </TabsList>

          {/* Tab Content for Adding a Customer */}
          {/* Renders the form and logic for adding new customer contacts. */}
          <TabsContent value="add-customer" className="space-y-4 mt-4">
            <AddCustomerTab
              categories={categories}
              handleSaveCustomerAction={handleSaveCustomerAndClearEdit}
            />
          </TabsContent>

          {/* Tab Content for Customer List */}
          {/* Displays the list of existing customers with options for filtering, editing, and deleting. */}
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

          {/* Tab Content for Category Management */}
          {/* Provides an interface for managing customer categories. */}
          <TabsContent value="categories" className="space-y-4 mt-4">
            <CategoryManagementTab
              categories={categories}
              customers={customers}
              // Pass the new category action handlers
              handleAddCategoryAction={handleAddCategoryAction}
              handleUpdateCategoryAction={handleUpdateCategoryAction}
              handleDeleteCategoryAction={handleDeleteCategoryAction}
              handleCategorySuccessfullyDeletedAction={
                handleCategorySuccessfullyDeletedAction
              }
              handleCategoryRenamedAction={handleCategoryRenamedAction}
            />
          </TabsContent>

          {/* Tab Content for Overall Communication Logs */}
          {/* Displays a consolidated view of communication logs across all customers. */}
          <TabsContent value="communication-logs" className="space-y-4 mt-4">
            <CommunicationLogsTab customers={customers} />
          </TabsContent>
        </Tabs>

        <CustomerEditModal
          isOpen={!!editingCustomer}
          onClose={handleCancelEdit}
          editingCustomer={editingCustomer}
          handleSaveCustomerAndClearEdit={handleSaveCustomerAndClearEdit}
          categories={categories}
        />
      </div>
    </>
  );
}

interface CRMTabsTriggerProps {
  value: string;
  children: React.ReactNode;
}

const CRMTabsTrigger: React.FC<CRMTabsTriggerProps> = ({ value, children }) => {
  return (
    <TabsTrigger
      value={value}
      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
    >
      {children}
    </TabsTrigger>
  );
};
