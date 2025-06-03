'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Import Card
import { Input } from '@/components/ui/input';
import { Download, Loader2 } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import ReactPaginate from 'react-paginate';
import { Toaster, toast } from 'sonner';
import useDebounce from '@/hooks/use-debounce';
import { CustomerForm } from './components/CustomerForm';
import { CustomerListItem } from './components/CustomerListItem';
import CategoryManager from './components/CategoryManager';
import type { Category, Contact, Customer, CommunicationLog } from './types';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Import Tabs

import Papa from 'papaparse';
import fuzzysort from 'fuzzysort';

const fuzzysortOptions = {
  keys: ['name', 'email', 'phone', 'notes', 'company'],
  threshold: -700, // fuzzysort uses a negative threshold (lower is better)
};

const generateCustomerCSVData = (customers: Customer[]): string | null => {
  if (customers.length === 0) {
    return null;
  }

  const csvData = Papa.unparse({
    fields: ['id', 'name', 'email', 'phone', 'company', 'notes', 'category'], // Add category field
    data: customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      notes: customer.notes,
      category: customer.category, // Include category data
    })),
  });

  return csvData;
};

const filterCustomers = (
  customers: Customer[],
  searchQuery: string,
  selectedCategory: string | null, // Add selectedCategory parameter
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
    // Filter results first
    results = fuzzysort
      .go(searchQuery, results, {
        keys: fuzzysortOptions.keys as [string],
        threshold: fuzzysortOptions.threshold,
      })
      .map((result) => result.obj); // Access original object
  }

  return results;
};

interface CustomerListContentProps {
  customers: Customer[];
  searchQuery: string;
  hasAttemptedInitialLoad: boolean;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onCopyNotes: (notes: string) => void;
  itemsPerPage: number;
  currentPage: number;
  onCommunicationLogSave: (log: Omit<CommunicationLog, 'id'>) => Promise<void>;
  onCommunicationLogUpdate: (log: CommunicationLog) => Promise<void>;
  onCommunicationLogDelete: (
    logId: string,
    customerId: string,
  ) => Promise<void>;
}

const CustomerListContent: React.FC<CustomerListContentProps> = ({
  customers,
  searchQuery,
  hasAttemptedInitialLoad,
  onEdit,
  onDelete,
  onCopyNotes,
  itemsPerPage,
  currentPage,
  onCommunicationLogSave,
  onCommunicationLogUpdate,
  onCommunicationLogDelete,
}) => {
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCustomers = customers.slice(startIndex, endIndex);

  if (currentCustomers.length > 0) {
    return (
      <div className="space-y-4">
        {currentCustomers.map((customer) => (
          <CustomerListItem
            key={`customer-card-${customer.id}`}
            customer={customer}
            onEdit={onEdit}
            onDelete={onDelete}
            onCopyNotes={onCopyNotes}
            onCommunicationLogSave={onCommunicationLogSave}
            onCommunicationLogUpdate={onCommunicationLogUpdate}
            onCommunicationLogDelete={onCommunicationLogDelete}
          />
        ))}
      </div>
    );
  }

  let emptyStateContent;
  if (searchQuery) {
    emptyStateContent = 'No customers match your search.';
  } else if (hasAttemptedInitialLoad) {
    emptyStateContent = 'No customers added yet.';
  } else {
    emptyStateContent = <Loader2 className="h-4 w-4 animate-spin" />;
  }

  return <p className="text-muted-foreground">{emptyStateContent}</p>;
};

export default function CRMComponent() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [hasAttemptedInitialLoad, setHasAttemptedInitialLoad] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(5);
  const [categories, setCategories] = useState<Category[]>([]); // State for categories
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // State for selected category filter

  const handlePageClick = (selectedObject: { selected: number }) => {
    setCurrentPage(selectedObject.selected);
  };

  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const allContacts = await getAllContacts();
        const allCustomers: Customer[] = allContacts.map(
          (contact) =>
            ({
              ...contact,
              id: contact.id!,
              category: contact.category || '', // Ensure category is set
              communicationLogs: contact.communicationLogs || [], // Initialize communication logs
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

  const handleCancelEdit = () => {
    setEditingCustomer(null);
  };

  const handleSaveCustomer = async (formData: Omit<Contact, 'id'>) => {
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
                } // Preserve existing communication logs
              : customer,
          ),
        );
        toast.success('Customer updated successfully!');
        setEditingCustomer(null);
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
          category: newCustomer.category || '', // Ensure category is passed
          communicationLogs: [], // Initialize empty array for new customer
        } as Customer;
        setCustomers([...customers, completeNewCustomer]);
        toast.success('Customer added successfully!');
      } catch (error) {
        console.error('Error adding customer to IndexedDB:', error);
        toast.error('Failed to add customer. See console for details.');
      }
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer({ ...customer });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteContact(id);
        setCustomers(
          customers.filter((customer: Customer) => customer.id !== id),
        );
        toast.info('Customer deleted.');
        if (editingCustomer?.id === id) {
          setEditingCustomer(null);
        }
      } catch (error) {
        console.error('Error deleting customer from IndexedDB:', error);
        toast.error('Failed to delete customer. See console for details.');
      }
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

  const handleCategoriesUpdate = (updatedCategories: Category[]) => {
    setCategories(updatedCategories);
  };

  const handleCategorySuccessfullyDeleted = async (
    deletedCategoryName: string,
  ) => {
    // Update customers whose category was the deleted one to be uncategorized
    const customersToUpdate = customers.filter(
      (customer) => customer.category === deletedCategoryName,
    );

    const updatePromises = customersToUpdate.map(async (customer) => {
      const updatedCustomer = { ...customer, category: '' }; // Set to empty string for uncategorized
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
  };

  const handleCategoryRenamed = async (oldName: string, newName: string) => {
    // Update customers whose category was the old name to the new name
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
    toast.info(`Customers previously in "${oldName}" are now in "${newName}".`);
  };

  const customerCounts = useMemo(() => {
    const counts = new Map<string | null, number>();
    customers.forEach((customer) => {
      const categoryName = customer.category || null; // Use null for uncategorized
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

  const handleCreateCommunicationLog = async (
    log: Omit<CommunicationLog, 'id'>,
  ) => {
    try {
      const newLogId = await createCommunicationLog(log);
      if (newLogId) {
        // Update the customer in the state with the new log
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
      }
    } catch (error) {
      console.error('Error creating communication log:', error);
      toast.error('Failed to create communication log.');
    }
  };

  const handleUpdateCommunicationLog = async (log: CommunicationLog) => {
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
    } catch (error) {
      console.error('Error updating communication log:', error);
      toast.error('Failed to update communication log.');
    }
  };

  const handleDeleteCommunicationLog = async (
    logId: string,
    customerId: string,
  ) => {
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
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold my-6 text-center">CRM Dashboard</h1>
        <p className="text-lg text-muted-foreground text-center mb-8">
          Manage your customer relationships, track interactions, and organize
          contact information.
        </p>

        <Tabs defaultValue="add-customer" className="w-full">
          <TabsList className="mb-4 flex flex-wrap h-auto justify-start bg-gray-100 dark:bg-gray-700">
            <TabsTrigger
              value="add-customer"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-gray-700 dark:text-gray-200"
            >
              Add Customer
            </TabsTrigger>
            <TabsTrigger
              value="customer-list"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-gray-700 dark:text-gray-200"
            >
              Customer List
            </TabsTrigger>
            <TabsTrigger
              value="categories"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-gray-700 dark:text-gray-200"
            >
              Categories
            </TabsTrigger>
            <TabsTrigger
              value="communication-logs"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-gray-700 dark:text-gray-200"
            >
              Communication Logs (Overall)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add-customer" className="space-y-4 mt-4">
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="flex flex-col gap-6 flex-1">
                <Card className="flex-1">
                  <CardHeader>
                    <CardTitle>
                      {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CustomerForm
                      key={
                        editingCustomer
                          ? editingCustomer.id
                          : 'add-customer-form'
                      }
                      initialData={
                        editingCustomer
                          ? {
                              name: editingCustomer.name,
                              email: editingCustomer.email,
                              phone: editingCustomer.phone,
                              company: editingCustomer.company,
                              notes: editingCustomer.notes,
                              category: editingCustomer.category,
                            }
                          : null
                      }
                      onSubmitSuccessAction={handleSaveCustomer}
                      onCancel={editingCustomer ? handleCancelEdit : undefined}
                      isEditing={!!editingCustomer}
                      categories={categories}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="customer-list" className="space-y-4 mt-4">
            <Card className="flex-1">
              <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle className="whitespace-nowrap">
                  Customer List
                </CardTitle>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto md:ml-auto">
                  <Input
                    type="search"
                    placeholder="Search customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-auto md:min-w-[250px] lg:min-w-[300px]"
                  />
                  <select
                    value={selectedCategory || ''}
                    onChange={(e) =>
                      setSelectedCategory(e.target.value || null)
                    }
                    className="w-full sm:w-auto p-2 border rounded-md bg-background text-foreground"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                    <option value="Uncategorized">Uncategorized</option>
                  </select>
                  <Button
                    variant="outline"
                    onClick={exportTasksToCSV}
                    title="Export customers to CSV"
                    className="w-full sm:w-auto"
                  >
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <CustomerListContent
                  customers={filteredCustomers}
                  searchQuery={searchQuery}
                  hasAttemptedInitialLoad={hasAttemptedInitialLoad}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onCopyNotes={handleCopyToClipboard}
                  itemsPerPage={itemsPerPage}
                  currentPage={currentPage}
                  onCommunicationLogSave={handleCreateCommunicationLog}
                  onCommunicationLogUpdate={handleUpdateCommunicationLog}
                  onCommunicationLogDelete={handleDeleteCommunicationLog}
                />
                <ReactPaginate
                  previousLabel={'Previous'}
                  nextLabel={'Next'}
                  pageCount={pageCount}
                  onPageChange={handlePageClick}
                  containerClassName="pagination hubspot-pagination"
                  previousLinkClassName="hubspot-pagination__link"
                  nextLinkClassName="hubspot-pagination__link"
                  disabledClassName="hubspot-pagination__link--disabled"
                  activeClassName="hubspot-pagination__link--active"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4 mt-4">
            <CategoryManager
              onCategoriesUpdate={handleCategoriesUpdate}
              initialCategories={categories}
              onCategorySuccessfullyDeleted={handleCategorySuccessfullyDeleted}
              onCategoryRenamed={handleCategoryRenamed}
              customerCounts={customerCounts}
            />
          </TabsContent>

          {/* New Tab for Overall Communication Logs */}
          <TabsContent value="communication-logs" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>All Communication Logs</CardTitle>
              </CardHeader>
              <CardContent>
                {customers.flatMap(
                  (customer) => customer.communicationLogs || [],
                ).length === 0 ? (
                  <p className="text-muted-foreground">
                    No communication logs recorded across all customers.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {customers
                      .flatMap((customer) =>
                        (customer.communicationLogs || []).map((log) => ({
                          ...log,
                          customerName: customer.name,
                        })),
                      )
                      .sort((a, b) => b.date - a.date) // Sort by date descending
                      .map((log) => (
                        <Card
                          key={`${log.customerId}-${log.id}`}
                          className="p-4"
                        >
                          {' '}
                          {/* Changed key to be unique per customer+logId */}
                          <p className="text-sm text-muted-foreground">
                            {new Date(log.date).toLocaleString()} - {log.type}{' '}
                            for <strong>{log.customerName}</strong>
                          </p>
                          {log.subject && (
                            <p className="font-semibold">{log.subject}</p>
                          )}
                          <p className="whitespace-pre-wrap">{log.notes}</p>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
