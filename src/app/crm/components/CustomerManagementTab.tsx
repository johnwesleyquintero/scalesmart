'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Download, Loader2, Trash2 } from 'lucide-react';
import ReactPaginate from 'react-paginate';
import { toast } from 'sonner';
import useDebounce from '@/hooks/use-debounce';
import { CustomerForm } from './CustomerForm';
import { CustomerListItem } from './CustomerListItem';
import type { Contact, CommunicationLog, Category } from '../types'; // Import Category
import {
  filterCustomers,
  generateCustomerCSVData,
} from '../utils/customerUtils'; // Import from utils

interface CustomerManagementTabProps {
  customers: Contact[];
  hasAttemptedInitialLoad: boolean;
  categories: Category[];
  handleSaveCustomerAction: (
    formData: Omit<Contact, 'id'>,
    editingCustomer: Contact | null,
  ) => Promise<void>;
  handleDeleteCustomerAction: (id: string) => Promise<void>;
  handleCreateCommunicationLogAction: (
    log: Omit<CommunicationLog, 'id'>,
  ) => Promise<void>;
  handleUpdateCommunicationLogAction: (log: CommunicationLog) => Promise<void>;
  handleDeleteCommunicationLogAction: (
    logId: string,
    customerId: string,
  ) => Promise<void>;
}

export const CustomerManagementTab: React.FC<CustomerManagementTabProps> = ({
  customers,
  hasAttemptedInitialLoad,
  categories,
  handleSaveCustomerAction,
  handleDeleteCustomerAction,
  handleCreateCommunicationLogAction,
  handleUpdateCommunicationLogAction,
  handleDeleteCommunicationLogAction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [editingCustomer, setEditingCustomer] = useState<Contact | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(5);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);

  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCustomers = customers.slice(startIndex, endIndex);

  let emptyStateContent;
  if (searchQuery) {
    emptyStateContent = 'No customers match your search.';
  } else if (hasAttemptedInitialLoad) {
    emptyStateContent = 'No customers added yet.';
  } else {
    emptyStateContent = <Loader2 className="h-4 w-4 animate-spin" />;
  }

  const handlePageClick = (selectedObject: { selected: number }) => {
    setCurrentPage(selectedObject.selected);
  };

  const handleCancelEdit = () => {
    setEditingCustomer(null);
  };

  const handleSave = async (formData: Omit<Contact, 'id'>) => {
    await handleSaveCustomerAction(formData, editingCustomer);
    setEditingCustomer(null);
  };

  const handleEdit = (customer: Contact) => {
    setEditingCustomer({ ...customer });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    await handleDeleteCustomerAction(id);
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

  const exportCustomersToCSV = () => {
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

  const handleSelectCustomer = (id: string, isSelected: boolean) => {
    setSelectedCustomerIds((prev) => {
      if (isSelected) {
        return [...prev, id];
      } else {
        return prev.filter((customerId) => customerId !== id);
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedCustomerIds.length === 0) {
      toast.info('No customers selected for deletion.');
      return;
    }

    for (const id of selectedCustomerIds) {
      await handleDeleteCustomerAction(id);
      if (editingCustomer?.id === id) {
        setEditingCustomer(null);
      }
    }

    setSelectedCustomerIds([]);
    toast.success('Selected customers deleted successfully!');
  };

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
              onClick={exportCustomersToCSV}
              title="Export customers to CSV"
              className="w-full sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={selectedCustomerIds.length === 0}
              title="Delete selected customers"
              className="w-full sm:w-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {currentCustomers.length > 0 ? (
            <div className="space-y-4">
              {currentCustomers.map((customer) => (
                <CustomerListItem
                  key={`customer-card-${customer.id}`}
                  customer={customer}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onCopyNotes={handleCopyToClipboard}
                  onCommunicationLogSaveAction={
                    handleCreateCommunicationLogAction
                  }
                  onCommunicationLogUpdateAction={
                    handleUpdateCommunicationLogAction
                  }
                  onCommunicationLogDeleteAction={
                    handleDeleteCommunicationLogAction
                  }
                  onSelect={handleSelectCustomer}
                  isSelected={
                    customer.id
                      ? selectedCustomerIds.includes(customer.id)
                      : false
                  }
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">{emptyStateContent}</p>
          )}
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
