'use client';

import { Toaster } from 'sonner';
import { useMemo } from 'react';
import type { Customer } from './types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useCRMData } from '@/hooks/use-crm-data';
import { CustomerManagementTab } from './components/CustomerManagementTab';
import { CategoryManagementTab } from './components/CategoryManagementTab';
import { CommunicationLogsTab } from './components/CommunicationLogsTab';

export default function CRMComponent() {
  const {
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
  } = useCRMData();

  const customerCounts = useMemo(() => {
    const counts = new Map<string | null, number>();
    customers.forEach((customer) => {
      const categoryName = customer.category || null;
      counts.set(categoryName, (counts.get(categoryName) || 0) + 1);
    });
    return counts;
  }, [customers]);

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
            <CustomerManagementTab
              customers={customers}
              hasAttemptedInitialLoad={hasAttemptedInitialLoad}
              categories={categories}
              handleSaveCustomer={handleSaveCustomer}
              handleDeleteCustomer={handleDeleteCustomer}
              handleCreateCommunicationLog={handleCreateCommunicationLog}
              handleUpdateCommunicationLog={handleUpdateCommunicationLog}
              handleDeleteCommunicationLog={handleDeleteCommunicationLog}
            />
          </TabsContent>

          <TabsContent value="customer-list" className="space-y-4 mt-4">
            <CustomerManagementTab
              customers={customers}
              hasAttemptedInitialLoad={hasAttemptedInitialLoad}
              categories={categories}
              handleSaveCustomer={handleSaveCustomer}
              handleDeleteCustomer={handleDeleteCustomer}
              handleCreateCommunicationLog={handleCreateCommunicationLog}
              handleUpdateCommunicationLog={handleUpdateCommunicationLog}
              handleDeleteCommunicationLog={handleDeleteCommunicationLog}
            />
          </TabsContent>

          <TabsContent value="categories" className="space-y-4 mt-4">
            <CategoryManagementTab
              categories={categories}
              customers={customers}
              handleCategoriesUpdate={handleCategoriesUpdate}
              handleCategorySuccessfullyDeleted={
                handleCategorySuccessfullyDeleted
              }
              handleCategoryRenamed={handleCategoryRenamed}
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
