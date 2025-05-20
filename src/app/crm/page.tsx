'use client';

import { Button } from '@/components/ui/button';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import ReactPaginate from 'react-paginate';
// import { useLocalStorage } from '../../hooks/use-local-storage';
import { Toaster, toast } from 'sonner'; // Import Toaster and toast
import useDebounce from '@/hooks/use-debounce';
import { CustomerForm } from './components/CustomerForm'; // Import new component
import { CustomerListItem } from './components/CustomerListItem'; // Import new component
import CategoryManager from './components/CategoryManager';
import type { Customer, Category } from './types'; // Import Category type
import {
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getAllCustomers,
  getAllCategories, // Import getAllCategories
} from '@/lib/indexeddb';

import Papa from 'papaparse';
import Fuse from 'fuse.js';

const fuseOptions = {
  keys: ['name', 'email', 'phone', 'notes', 'category'],
  threshold: 0.3,
};

// Helper function to generate CSV data string
const generateCustomerCSVData = (customers: Customer[]): string | null => {
  if (customers.length === 0) {
    return null;
  }

  const csvData = Papa.unparse({
    fields: ['id', 'name', 'email', 'phone', 'category', 'notes'],
    data: customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      category: customer.category,
      notes: customer.notes,
    })),
  });

  return csvData;
};

// Helper function to filter customers
const filterCustomers = (
  customers: Customer[],
  searchQuery: string,
  categoryFilter: string[],
  isCategoryFilterExact: boolean,
): Customer[] => {
  let results = customers;

  if (searchQuery) {
    const fuse = new Fuse(customers, fuseOptions);
    results = fuse.search(searchQuery).map((result) => result.item);
  }

  if (categoryFilter.length > 0) {
    results = results.filter((customer) => {
      if (isCategoryFilterExact) {
        return categoryFilter.includes(customer.category || '');
      } else {
        return categoryFilter.some((filter) =>
          customer.category?.toLowerCase().includes(filter.toLowerCase()),
        );
      }
    });
  }

  return results;
};

interface CustomerListContentProps {
  customers: Customer[];
  searchQuery: string;
  categoryFilter: string[];
  hasAttemptedInitialLoad: boolean;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onCopyNotes: (notes: string) => void;
  itemsPerPage: number;
  currentPage: number;
}

const CustomerListContent: React.FC<CustomerListContentProps> = ({
  customers,
  searchQuery,
  categoryFilter,
  hasAttemptedInitialLoad,
  onEdit,
  onDelete,
  onCopyNotes,
  itemsPerPage,
  currentPage,
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
          />
        ))}
      </div>
    );
  }

  // Logic for when filteredCustomers.length === 0
  let emptyStateContent;
  if (searchQuery && !categoryFilter) {
    emptyStateContent = 'No customers match your search.';
  } else if (!searchQuery && categoryFilter) {
    emptyStateContent = 'No customers match the selected category.';
  } else if (searchQuery && categoryFilter) {
    emptyStateContent =
      'No customers match your search and the selected category.';
  } else if (hasAttemptedInitialLoad) {
    // No filters active, initial load done
    emptyStateContent = 'No customers added yet.';
  } else {
    // No filters active, initial load not done (or in progress)
    emptyStateContent = <Loader2 className="h-4 w-4 animate-spin" />;
  }

  return <p className="text-muted-foreground">{emptyStateContent}</p>;
};

export default function CRMComponent() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [hasAttemptedInitialLoad, setHasAttemptedInitialLoad] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(5);
  const [allAvailableCategories, setAllAvailableCategories] = useState<
    Category[]
  >([]);
  const [isCategoryFilterExact, setIsCategoryFilterExact] = useState(true);

  useEffect(() => {
    console.log('isCategoryFilterExact changed:', isCategoryFilterExact);
  }, [isCategoryFilterExact]);

  const handlePageClick = (selectedObject: { selected: number }) => {
    setCurrentPage(selectedObject.selected);
  };

  // Initialize customers state. The third argument [] is for server-side rendering
  // to prevent hydration mismatch, ensuring it's an empty array on first server render.
  const [customers, setCustomers] = useState<Customer[]>([]);
  // const [customers, setCustomers] = useLocalStorage<Customer[]>(
  //   'crmCustomers',
  //   [],
  //   [],
  // );

  const migrateDataFromLocalStorage = async () => {
    try {
      // Check if migration has already been performed
      if (localStorage.getItem('crmDataMigrated') !== 'true') {
        const localStorageData = localStorage.getItem('crmCustomers');
        if (localStorageData) {
          const parsedData: Customer[] = JSON.parse(localStorageData);
          for (const customer of parsedData) {
            await addCustomer(customer);
          }
          localStorage.removeItem('crmCustomers');
          // Set flag to indicate migration has been performed
          localStorage.setItem('crmDataMigrated', 'true');
          toast.success(
            'Successfully migrated data from localStorage to IndexedDB!',
          );
        }
      }
    } catch (error) {
      console.error('Error migrating data from localStorage:', error);
      toast.error(
        'Failed to migrate data from localStorage. See console for details.',
      );
    }
  };

  // This effect helps in determining if we have tried to load from localStorage.
  // Useful for showing a loading state or a "no data" message correctly.
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await migrateDataFromLocalStorage();
        const allCustomers = await getAllCustomers();
        setCustomers(allCustomers);

        const fetchedCategories = await getAllCategories();
        setAllAvailableCategories(fetchedCategories);
      } catch (error) {
        console.error('Error loading customers from IndexedDB:', error);
        toast.error('Failed to load customers. See console for details.');
        // Consider separate error handling for categories if needed
      } finally {
        setHasAttemptedInitialLoad(true);
      }
    };
    loadInitialData();
  }, []);

  const handleCancelEdit = () => {
    setEditingCustomer(null);
  };

  const handleSaveCustomer = async (formData: Omit<Customer, 'id'>) => {
    if (editingCustomer) {
      // Update existing customer
      const updatedCustomer: Customer = {
        ...formData,
        id: editingCustomer.id,
        category: formData.category === '' ? null : formData.category,
      };
      try {
        await updateCustomer(updatedCustomer);
        setCustomers(
          customers.map((customer: Customer) =>
            customer.id === editingCustomer.id ? updatedCustomer : customer,
          ),
        );
        toast.success('Customer updated successfully!');
        setEditingCustomer(null);
      } catch (error) {
        console.error('Error updating customer in IndexedDB:', error);
        toast.error('Failed to update customer. See console for details.');
      }
    } else {
      // Add new customer
      const newCustomer: Customer = {
        ...formData,
        id: Date.now().toString(),
        category: formData.category === '' ? null : formData.category,
      };
      try {
        await addCustomer(newCustomer);
        setCustomers([...customers, newCustomer]);
        toast.success('Customer added successfully!');
      } catch (error) {
        console.error('Error adding customer to IndexedDB:', error);
        toast.error('Failed to update customer. See console for details.');
      }
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer({
      ...customer,
      category: customer.category === 'null' ? '' : customer.category || '',
    } as Customer);
    // Scroll to form for better UX, optional
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomer(id);
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
      // Feature detection
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

  const filteredCustomers = filterCustomers(
    customers,
    debouncedSearchQuery,
    categoryFilter,
    isCategoryFilterExact,
  );

  // Derive unique category names for the filter dropdown from allAvailableCategories
  const uniqueCategoriesForFilter = allAvailableCategories
    .map((cat) => cat.name)
    .sort();

  const pageCount = Math.ceil(filteredCustomers.length / itemsPerPage);

  const handleCategoriesUpdated = (updatedCategories: Category[]) => {
    setAllAvailableCategories(updatedCategories);
    // If a category was renamed, we might need to update customers here too.
    // For now, this handles additions and ensures the list is fresh.
    // Deletion cleanup is handled by onCategorySuccessfullyDeleted.
  };

  const handleCategorySuccessfullyDeleted = async (
    deletedCategoryName: string,
  ) => {
    const customersToUpdate = customers.filter(
      (customer) => customer.category === deletedCategoryName,
    );

    if (customersToUpdate.length > 0) {
      try {
        const updatePromises = customersToUpdate.map(
          (customer) => updateCustomer({ ...customer, category: null }), // Set category to null
        );
        await Promise.all(updatePromises);

        // Update local state
        setCustomers((prevCustomers) =>
          prevCustomers.map((customer) =>
            customer.category === deletedCategoryName
              ? { ...customer, category: null }
              : customer,
          ),
        );
        toast.info(
          `Customers previously in '${deletedCategoryName}' category have been updated to 'None'.`,
        );
      } catch (error) {
        console.error(
          'Error updating customers after category deletion:',
          error,
        );
        toast.error(
          'Failed to update some customers after category deletion. Please check console.',
        );
      }
    }
  };

  const handleCategoryRenamed = async (oldName: string, newName: string) => {
    const customersToUpdate = customers.filter(
      (customer) => customer.category === oldName,
    );

    if (customersToUpdate.length > 0) {
      try {
        const updatePromises = customersToUpdate.map((customer) =>
          updateCustomer({ ...customer, category: newName }),
        );
        await Promise.all(updatePromises);

        // Update local state
        setCustomers((prevCustomers) =>
          prevCustomers.map((customer) =>
            customer.category === oldName
              ? { ...customer, category: newName }
              : customer,
          ),
        );
        toast.info(
          `Customers in category '${oldName}' have been moved to '${newName}'.`,
        );
      } catch (error) {
        console.error('Error updating customers after category rename:', error);
        toast.error(
          'Failed to update some customers after category rename. Please check console.',
        );
      }
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
        <div className="flex flex-col gap-6">
          <div className="card flex-1">
            <CardHeader>
              <CardTitle>
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerForm
                key={editingCustomer ? editingCustomer.id : 'add-customer-form'} // Re-key to reset form state when editingCustomer changes
                initialData={
                  editingCustomer
                    ? {
                        name: editingCustomer.name,
                        email: editingCustomer.email,
                        phone: editingCustomer.phone,
                        notes: editingCustomer.notes,
                        category: editingCustomer.category || '',
                      }
                    : null
                }
                onSubmitSuccessAction={handleSaveCustomer}
                onCancel={editingCustomer ? handleCancelEdit : undefined}
                isEditing={!!editingCustomer}
                categories={allAvailableCategories} // Pass categories to the form
              />
            </CardContent>
          </div>
          <CategoryManager
            onCategoriesUpdate={handleCategoriesUpdated}
            initialCategories={allAvailableCategories}
            key={allAvailableCategories.length}
            onCategorySuccessfullyDeleted={handleCategorySuccessfullyDeleted}
            onCategoryRenamed={handleCategoryRenamed}
          />

          <div className="card flex-1">
            <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <CardTitle className="whitespace-nowrap">Customer List</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto md:ml-auto">
                <Input
                  type="search"
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-auto md:min-w-[250px] lg:min-w-[300px]"
                />
                <Select
                  value={''}
                  onValueChange={(value: string) => {
                    if (categoryFilter.includes(value)) {
                      setCategoryFilter(
                        categoryFilter.filter((item) => item !== value),
                      );
                    } else {
                      setCategoryFilter([...categoryFilter, value]);
                    }
                  }}
                >
                  <SelectTrigger className="w-full sm:w-auto md:min-w-[180px]">
                    <SelectValue>
                      {categoryFilter.length === 0
                        ? 'Filter by category'
                        : categoryFilter.join(', ')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueCategoriesForFilter.map((categoryName) => (
                      <SelectItem key={categoryName} value={categoryName}>
                        {categoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="inline-flex items-center space-x-2 cursor-pointer">
                  <Label
                    htmlFor="exact-match"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Exact Match
                  </Label>
                  <Input
                    type="checkbox"
                    id="exact-match"
                    className="h-5 w-5 rounded-sm border-2 border-primary ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    checked={isCategoryFilterExact}
                    onChange={(e) => {
                      setIsCategoryFilterExact(e.target.checked);
                    }}
                  />
                </div>
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
                categoryFilter={categoryFilter}
                hasAttemptedInitialLoad={hasAttemptedInitialLoad}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCopyNotes={handleCopyToClipboard}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
              />
              <ReactPaginate
                previousLabel={'Previous'}
                nextLabel={'Next'}
                pageCount={pageCount}
                onPageChange={handlePageClick}
                containerClassName={'pagination hubspot-pagination'}
                previousLinkClassName="hubspot-pagination__link"
                nextLinkClassName="hubspot-pagination__link"
                disabledClassName="hubspot-pagination__link--disabled"
                activeClassName="hubspot-pagination__link--active"
              />
            </CardContent>
          </div>
        </div>
      </div>
    </>
  );
}
