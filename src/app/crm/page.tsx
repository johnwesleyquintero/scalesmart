'use client';

import { Button } from '@/components/ui/button';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Download, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import ReactPaginate from 'react-paginate';
import { Toaster, toast } from 'sonner';
import useDebounce from '@/hooks/use-debounce';
import { CustomerForm } from './components/CustomerForm';
import { CustomerListItem } from './components/CustomerListItem';
import type { Contact, Customer } from './types';
import {
  createContact,
  updateContact,
  deleteContact,
  getAllContacts,
} from '@/lib/indexeddb-service';

import Papa from 'papaparse';
import Fuse from 'fuse.js';
import { useMemo } from 'react';

const fuseOptions = {
  keys: ['name', 'email', 'phone', 'notes', 'company'],
  threshold: 0.3,
};

const generateCustomerCSVData = (customers: Customer[]): string | null => {
  if (customers.length === 0) {
    return null;
  }

  const csvData = Papa.unparse({
    fields: ['id', 'name', 'email', 'phone', 'company', 'notes'],
    data: customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      notes: customer.notes,
    })),
  });

  return csvData;
};

const filterCustomers = (
  customers: Customer[],
  searchQuery: string,
): Customer[] => {
  let results = customers;

  if (searchQuery) {
    const fuse = new Fuse(customers, fuseOptions);
    results = fuse.search(searchQuery).map((result) => result.item);
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
              category: '',
              notes: '',
            }) as Customer,
        );
        setCustomers(allCustomers);
      } catch (error) {
        console.error('Error loading customers from IndexedDB:', error);
        toast.error('Failed to load customers. See console for details.');
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
              ? { ...customer, ...updatedCustomer }
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
          category: '',
          notes: '',
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

  const filteredCustomers = filterCustomers(customers, debouncedSearchQuery);

  const pageCount = Math.ceil(filteredCustomers.length / itemsPerPage);

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
                key={editingCustomer ? editingCustomer.id : 'add-customer-form'}
                initialData={
                  editingCustomer
                    ? {
                        name: editingCustomer.name,
                        email: editingCustomer.email,
                        phone: editingCustomer.phone,
                        company: editingCustomer.company,
                        notes: editingCustomer.notes,
                      }
                    : null
                }
                onSubmitSuccessAction={handleSaveCustomer}
                onCancel={editingCustomer ? handleCancelEdit : undefined}
                isEditing={!!editingCustomer}
              />
            </CardContent>
          </div>

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
          </div>
        </div>
      </div>
    </>
  );
}
