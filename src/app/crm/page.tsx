'use client';

import { Toaster, toast } from 'sonner';
import { useState, useMemo } from 'react';
import useDebounce from '@/hooks/use-debounce';
import type { Category, Contact, Customer, CommunicationLog } from './types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import Papa from 'papaparse';
import fuzzysort from 'fuzzysort';
import { useCRMData } from '@/hooks/use-crm-data';
import { CustomerManagementTab } from './components/CustomerManagementTab';
import { CategoryManagementTab } from './components/CategoryManagementTab';
import { CommunicationLogsTab } from './components/CommunicationLogsTab';

type FuzzysortKeys = Array<'name' | 'email' | 'phone' | 'notes' | 'company'>;

const fuzzysortOptions: { keys: FuzzysortKeys; threshold: number } = {
  keys: ['name', 'email', 'phone', 'notes', 'company'],
  threshold: -700,
};

const generateCustomerCSVData = (customers: Customer[]): string | null => {
  if (customers.length === 0) {
    return null;
  }

  const csvData = Papa.unparse({
    fields: ['id', 'name', 'email', 'phone', 'company', 'notes', 'category'],
    data: customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      notes: customer.notes,
      category: customer.category,
    })),
  });

  return csvData;
};

const filterCustomers = (
  customers: Customer[],
  searchQuery: string,
  selectedCategory: string | null,
): Customer[] => {
  let results = customers;

  if (selectedCategory) {
    results = results.filter(
      (customer) =>
        customer.category === selectedCategory ||
        (!customer.category && selectedCategory === 'Uncategorized'),
    );
  }

  if (searchQuery) {
    results = fuzzysort
      .go(searchQuery, results, {
        keys: fuzzysortOptions.keys,
        threshold: fuzzysortOptions.threshold,
      })
      .map((result) => result.obj);
  }

  return results;
};

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

  // Category Management Handlers for CustomerManagementTab
  const handleAddCategory = async (categoryName: string) => {
    // Generate a simple unique ID for the new category
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: categoryName,
    };
    await handleCategoriesUpdate([...categories, newCategory]);
  };

  const handleEditCategory = async (categoryId: string, newName: string) => {
    await handleCategoryRenamed(categoryId, newName);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    await handleCategorySuccessfullyDeleted(categoryId);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(5);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handlePageClick = (selectedObject: { selected: number }) => {
    setCurrentPage(selectedObject.selected);
  };

  const handleCancelEdit = () => {
    setEditingCustomer(null);
  };

  const handleSave = async (formData: Omit<Contact, 'id'>) => {
    await handleSaveCustomer(formData, editingCustomer);
    setEditingCustomer(null); // Clear editing customer after save
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer({ ...customer });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    await handleDeleteCustomer(id);
    if (editingCustomer?.id === id) {
      setEditingCustomer(null);
    }
  };

  const handleCopyToClipboard = async (text: string) => {
    if (!navigator.clipboard) {
      toast.error('Clipboard API not available. Please copy manually.');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Notes copied to clipboard as Markdown!');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast.error('Failed to copy notes. See console for details.');
    }
  };

  const exportTasksToCSV = () => {
    const csvString = generateCustomerCSVData(customers);
    if (!csvString) {
      toast.info('No customers to export.');
      return;
    }

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'customers.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Customers exported successfully!');
    } else {
      toast.error('CSV export is not supported by your browser.');
    }
  };

  const customerCounts = useMemo(() => {
    const counts = new Map<string | null, number>();
    customers.forEach((customer) => {
      const categoryName = customer.category || null;
      counts.set(categoryName, (counts.get(categoryName) || 0) + 1);
    });
    return counts;
  }, [customers]);

  const filteredCustomers = filterCustomers(
    customers,
    debouncedSearchQuery,
    selectedCategory,
  );

  const pageCount = Math.ceil(filteredCustomers.length / itemsPerPage);

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
              onAddCategory={handleAddCategory}
              onEditCategory={handleEditCategory}
              onDeleteCategory={handleDeleteCategory}
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
              onAddCategory={handleAddCategory}
              onEditCategory={handleEditCategory}
              onDeleteCategory={handleDeleteCategory}
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
