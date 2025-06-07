'use client';

import { Toaster } from 'sonner';
import { useState, useCallback } from 'react';
import type { Contact } from './types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Modal from '@/components/Modal'; // Import the Modal component
import { CustomerForm } from './components/CustomerForm'; // Import the CustomerForm component

import { useCRMData } from '@/hooks/use-crm-data';
import { AddCustomerTab } from './components/AddCustomerTab';
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
    customers,
    hasAttemptedInitialLoad,
    categories,
    handleSaveCustomerAction,
    handleDeleteCustomerAction,
    // Destructure new category action handlers
    handleAddCategoryAction,
    handleUpdateCategoryAction,
    handleDeleteCategoryAction,
    handleCategorySuccessfullyDeletedAction,
    handleCategoryRenamedAction,
    handleCreateCommunicationLogAction,
    handleUpdateCommunicationLogAction,
    handleDeleteCommunicationLogAction,
  } = useCRMData();

  // State to manage which customer is currently being edited
  const [editingCustomer, setEditingCustomer] = useState<Contact | null>(null);

  /**
   * Callback to set the customer currently being edited.
   * Memoized with useCallback for performance, as it only updates state.
   */
  const handleEditCustomer = useCallback((customer: Contact) => {
    setEditingCustomer(customer);
  }, []);

  /**
   * Callback to clear the editing state, closing the modal.
   */
  const handleCancelEdit = useCallback(() => {
    setEditingCustomer(null);
  }, []);

  /**
   * Callback to save a customer and then clear the editing state.
   * This ensures the form resets after a successful save operation.
   * Memoized with useCallback, depending on `handleSaveCustomerAction`.
   */
  const handleSaveCustomerAndClearEdit = useCallback(
    async (formData: Omit<Contact, 'id'>, customerToEdit: Contact | null) => {
      await handleSaveCustomerAction(formData, customerToEdit);
      setEditingCustomer(null); // Clear editing state after save
    },
    [handleSaveCustomerAction],
  );

  return (
    <>
      {/* Toaster for displaying notifications */}
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

          {/* Tab Content for Adding a Customer */}
          <TabsContent value="add-customer" className="space-y-4 mt-4">
            <AddCustomerTab
              categories={categories}
              handleSaveCustomerAction={handleSaveCustomerAndClearEdit}
            />
          </TabsContent>

          {/* Tab Content for Customer List */}
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
          <TabsContent value="communication-logs" className="space-y-4 mt-4">
            <CommunicationLogsTab customers={customers} />
          </TabsContent>
        </Tabs>

        {/* Modal for Editing Customer */}
        <Modal
          isOpen={!!editingCustomer} // Open modal if editingCustomer is not null
          onClose={handleCancelEdit} // Close modal on cancel
          title={editingCustomer ? 'Edit Customer' : ''} // Set modal title
        >
          {editingCustomer && ( // Only render form if editingCustomer exists
            <CustomerForm
              initialData={editingCustomer} // Pass the customer data to the form
              onSubmitSuccessAction={(formData) =>
                handleSaveCustomerAndClearEdit(formData, editingCustomer)
              } // Handle save and close modal
              onCancel={handleCancelEdit} // Handle cancel and close modal
              isEditing={true} // Indicate that the form is in editing mode
              categories={categories} // Pass categories to the form
            />
          )}
        </Modal>
      </div>
    </>
  );
}
