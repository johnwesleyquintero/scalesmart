'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Download, Loader2 } from 'lucide-react';
import ReactPaginate from 'react-paginate';
import { toast } from 'sonner';
import useDebounce from '@/hooks/use-debounce';
import { CustomerForm } from './CustomerForm';
import { CustomerListItem } from './CustomerListItem';
import type { Category, Contact, Customer, CommunicationLog } from '../types';

import Papa from 'papaparse';
import fuzzysort from 'fuzzysort';

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

interface CustomerManagementTabProps {
  customers: Customer[];
  hasAttemptedInitialLoad: boolean;
  categories: Category[];
  handleSaveCustomer: (
    formData: Omit<Contact, 'id'>,
    editingCustomer: Customer | null,
  ) => Promise<void>;
  handleDeleteCustomer: (id: string) => Promise<void>;
  handleCreateCommunicationLog: (
    log: Omit<CommunicationLog, 'id'>,
  ) => Promise<void>;
  handleUpdateCommunicationLog: (log: CommunicationLog) => Promise<void>;
  handleDeleteCommunicationLog: (
    logId: string,
    customerId: string,
  ) => Promise<void>;
}

export const CustomerManagementTab: React.FC<CustomerManagementTabProps> = ({
  customers,
  hasAttemptedInitialLoad,
  categories,
  handleSaveCustomer,
  handleDeleteCustomer,
  handleCreateCommunicationLog,
  handleUpdateCommunicationLog,
  handleDeleteCommunicationLog,
}) => {
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
    setEditingCustomer(null);
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

  const filteredCustomers = filterCustomers(
    customers,
    debouncedSearchQuery,
    selectedCategory,
  );

  const pageCount = Math.ceil(filteredCustomers.length / itemsPerPage);

  return (
    <>
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
                key={editingCustomer ? editingCustomer.id : 'add-customer-form'}
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
                onSubmitSuccessAction={handleSave}
                onCancel={editingCustomer ? handleCancelEdit : undefined}
                isEditing={!!editingCustomer}
                categories={categories}
              />
            </CardContent>
          </Card>
        </div>
      </div>

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
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
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
    </>
  );
};
