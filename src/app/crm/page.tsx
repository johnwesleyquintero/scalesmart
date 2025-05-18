'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Download, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
// import { useLocalStorage } from '../../hooks/use-local-storage';
import { Toaster, toast } from 'sonner'; // Import Toaster and toast
import { CustomerForm } from './components/CustomerForm'; // Import new component
import { CustomerListItem } from './components/CustomerListItem'; // Import new component
import type { Customer } from './types'; // Import Customer type
import {
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getAllCustomers,
} from '@/lib/indexeddb';

// Helper function to escape fields for CSV
const escapeCSVField = (field: string | undefined | null): string => {
  if (field === undefined || field === null) {
    return '';
  }
  let str = String(field);
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    str = str.replace(/"/g, '""');
    return `"${str}"`;
  }
  return str;
};

// Helper function to generate CSV data string
const generateCustomerCSVData = (customers: Customer[]): string | null => {
  if (customers.length === 0) {
    return null;
  }
  const headers = ['ID', 'Name', 'Email', 'Phone', 'Category', 'Notes'];
  const csvRows = [headers.join(',')];
  customers.forEach((customer) => {
    csvRows.push(
      [
        escapeCSVField(customer.id),
        escapeCSVField(customer.name),
        escapeCSVField(customer.email),
        escapeCSVField(customer.phone),
        escapeCSVField(customer.category),
        escapeCSVField(customer.notes),
      ].join(','),
    );
  });
  return csvRows.join('\n');
};

// Helper function to filter customers
const filterCustomers = (
  customers: Customer[],
  searchQuery: string,
  categoryFilter: string,
): Customer[] => {
  const normalizedQuery = searchQuery.toLowerCase().trim();
  return customers.filter((customer) => {
    const matchesSearch =
      !normalizedQuery ||
      Object.values(customer).some(
        (value) =>
          typeof value === 'string' &&
          value.toLowerCase().includes(normalizedQuery),
      );
    const matchesCategory =
      !categoryFilter || customer.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });
};

interface CustomerListContentProps {
  filteredCustomers: Customer[];
  searchQuery: string;
  categoryFilter: string;
  hasAttemptedInitialLoad: boolean;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onCopyNotes: (notes: string) => void;
}

const CustomerListContent: React.FC<CustomerListContentProps> = ({
  filteredCustomers,
  searchQuery,
  categoryFilter,
  hasAttemptedInitialLoad,
  onEdit,
  onDelete,
  onCopyNotes,
}) => {
  if (filteredCustomers.length > 0) {
    return (
      <div className="space-y-4">
        {filteredCustomers.map((customer) => (
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
  const [hasAttemptedInitialLoad, setHasAttemptedInitialLoad] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');

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
      const localStorageData = localStorage.getItem('crmCustomers');
      if (localStorageData) {
        const parsedData: Customer[] = JSON.parse(localStorageData);
        for (const customer of parsedData) {
          await addCustomer(customer);
        }
        localStorage.removeItem('crmCustomers');
        toast.success(
          'Successfully migrated data from localStorage to IndexedDB!',
        );
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
    const loadCustomers = async () => {
      try {
        await migrateDataFromLocalStorage();
        const allCustomers = await getAllCustomers();
        setCustomers(allCustomers);
      } catch (error) {
        console.error('Error loading customers from IndexedDB:', error);
        toast.error('Failed to load customers. See console for details.');
      } finally {
        setHasAttemptedInitialLoad(true);
      }
    };

    loadCustomers();
  }, []);

  const handleCancelEdit = () => {
    setEditingCustomer(null);
  };

  const handleSaveCustomer = async (formData: Omit<Customer, 'id'>) => {
    if (editingCustomer) {
      // Update existing customer
      const updatedCustomer: Customer = { ...formData, id: editingCustomer.id };
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
      };
      try {
        await addCustomer(newCustomer);
        setCustomers([...customers, newCustomer]);
        toast.success('Customer added successfully!');
      } catch (error) {
        console.error('Error adding customer to IndexedDB:', error);
        toast.error('Failed to add customer. See console for details.');
      }
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
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
    searchQuery,
    categoryFilter,
  );

  const uniqueCategories = [
    ...new Set(
      customers
        .map((customer) => customer.category) // Get category: string | undefined | null
        .filter(
          (category): category is string =>
            typeof category === 'string' && category.trim() !== '',
        ) // Keep only strings that are not blank after trimming
        .map((category) => category.trim()), // Use the trimmed version
    ),
  ].sort();

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
          <Card className="flex-1">
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
                onSubmitSuccess={handleSaveCustomer}
                onCancel={editingCustomer ? handleCancelEdit : undefined}
                isEditing={!!editingCustomer}
              />
            </CardContent>
          </Card>

          <Card className="flex-1">
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
                  value={categoryFilter}
                  onValueChange={(value) =>
                    setCategoryFilter(value === 'all' ? '' : value)
                  }
                >
                  <SelectTrigger className="w-full sm:w-auto md:min-w-[180px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {uniqueCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                filteredCustomers={filteredCustomers}
                searchQuery={searchQuery}
                categoryFilter={categoryFilter}
                hasAttemptedInitialLoad={hasAttemptedInitialLoad}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCopyNotes={handleCopyToClipboard}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
