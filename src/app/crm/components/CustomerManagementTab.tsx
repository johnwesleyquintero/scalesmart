/**
 * @file CustomerManagementTab.tsx
 * @description This component provides the main interface for managing customers.
 * It includes functionalities for adding, editing, deleting, searching, filtering by category,
 * and exporting customer data. It also integrates with communication logs.
 */

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
import type { Contact, CommunicationLog, Category } from '../types';
import {
  filterCustomers,
  generateCustomerCSVData,
} from '../utils/customerUtils';

/**
 * Props for the CustomerManagementTab component.
 */
interface CustomerManagementTabProps {
  customers: Contact[]; // List of all customers.
  hasAttemptedInitialLoad: boolean; // Flag indicating if initial data load has been attempted.
  categories: Category[]; // List of available categories.
  handleSaveCustomerAction: (
    formData: Omit<Contact, 'id'>,
    editingCustomer: Contact | null,
  ) => Promise<void>; // Callback to save a new or updated customer.
  handleDeleteCustomerAction: (id: string) => Promise<void>; // Callback to delete a customer.
  handleCreateCommunicationLogAction: (
    log: Omit<CommunicationLog, 'id'>,
  ) => Promise<void>; // Callback to create a new communication log.
  handleUpdateCommunicationLogAction: (log: CommunicationLog) => Promise<void>; // Callback to update an existing communication log.
  handleDeleteCommunicationLogAction: (
    logId: string,
    customerId: string,
  ) => Promise<void>; // Callback to delete a communication log.
}

/**
 * CustomerManagementTab component.
 * Manages the display and interaction for customer data.
 */
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
  // State for search query input.
  const [searchQuery, setSearchQuery] = useState('');
  // Debounced search query to prevent excessive re-renders during typing.
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  // State to hold the customer currently being edited, or null if not editing.
  const [editingCustomer, setEditingCustomer] = useState<Contact | null>(null);
  // State for current pagination page.
  const [currentPage, setCurrentPage] = useState(0);
  // Number of items to display per page.
  const [itemsPerPage] = useState(5);
  // State for selected category filter.
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // State for selected customer IDs (for bulk actions).
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);

  /**
   * Memoized filtered customers based on search query and selected category.
   * This ensures filtering logic runs only when dependencies change.
   */
  const filteredCustomers = useMemo(() => {
    return filterCustomers(customers, debouncedSearchQuery, selectedCategory);
  }, [customers, debouncedSearchQuery, selectedCategory]);

  // Calculate total number of pages for pagination.
  const pageCount = Math.ceil(filteredCustomers.length / itemsPerPage);

  // Adjust current page if it's out of bounds after filtering.
  // This ensures the user doesn't see an empty page if the current page becomes invalid.
  React.useEffect(() => {
    if (currentPage >= pageCount && pageCount > 0) {
      setCurrentPage(pageCount - 1);
    } else if (pageCount === 0 && currentPage !== 0) {
      setCurrentPage(0);
    }
  }, [pageCount, currentPage]);

  // Slice the filtered customers to get only the ones for the current page.
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex);

  /**
   * Determines the content to display when no customers are found.
   */
  const emptyStateContent = useMemo(() => {
    if (searchQuery) {
      return 'No customers match your search criteria.';
    }
    if (selectedCategory) {
      return `No customers found in the "${selectedCategory}" category.`;
    }
    if (hasAttemptedInitialLoad) {
      return 'No customers added yet. Start by adding a new customer!';
    }
    return <Loader2 className="h-4 w-4 animate-spin" />; // Loading state
  }, [searchQuery, selectedCategory, hasAttemptedInitialLoad]);

  /**
   * Handles page change for pagination.
   */
  const handlePageClick = useCallback(
    (selectedObject: { selected: number }) => {
      setCurrentPage(selectedObject.selected);
    },
    [],
  );

  /**
   * Clears the editing customer state, effectively canceling an edit operation.
   */
  const handleCancelEdit = useCallback(() => {
    setEditingCustomer(null);
  }, []);

  /**
   * Handles saving a customer (add or update).
   * Calls the parent's `handleSaveCustomerAction` and clears the editing state.
   */
  const handleSave = useCallback(
    async (formData: Omit<Contact, 'id'>) => {
      await handleSaveCustomerAction(formData, editingCustomer);
      setEditingCustomer(null); // Clear editing state after save.
    },
    [handleSaveCustomerAction, editingCustomer],
  );

  /**
   * Sets the customer to be edited and scrolls to the top of the page.
   */
  const handleEdit = useCallback((customer: Contact) => {
    setEditingCustomer({ ...customer }); // Create a shallow copy to avoid direct mutation.
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top for better UX.
  }, []);

  /**
   * Handles deleting a single customer.
   * Also clears the editing state if the deleted customer was being edited.
   */
  const handleDelete = useCallback(
    async (id: string) => {
      await handleDeleteCustomerAction(id);
      if (editingCustomer?.id === id) {
        setEditingCustomer(null); // Clear editing state if the deleted customer was being edited.
      }
      setSelectedCustomerIds((prev) => prev.filter((cid) => cid !== id)); // Deselect if deleted.
    },
    [handleDeleteCustomerAction, editingCustomer],
  );

  /**
   * Copies the provided text (customer notes) to the clipboard.
   * Provides user feedback via toasts.
   */
  const handleCopyToClipboard = useCallback(async (text: string) => {
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
  }, []);

  /**
   * Exports all customers to a CSV file.
   * Generates CSV string and triggers a file download.
   */
  const exportCustomersToCSV = useCallback(() => {
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
  }, [customers]);

  /**
   * Handles selecting or deselecting a customer for bulk actions.
   */
  const handleSelectCustomer = useCallback(
    (id: string, isSelected: boolean) => {
      setSelectedCustomerIds((prev) => {
        if (isSelected) {
          return [...prev, id];
        } else {
          return prev.filter((customerId) => customerId !== id);
        }
      });
    },
    [],
  );

  /**
   * Handles bulk deletion of selected customers.
   * Iterates through selected IDs and calls `handleDeleteCustomerAction` for each.
   */
  const handleBulkDelete = useCallback(async () => {
    if (selectedCustomerIds.length === 0) {
      toast.info('No customers selected for deletion.');
      return;
    }

    // Confirm deletion with the user (optional, but good practice for destructive actions)
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedCustomerIds.length} selected customer(s)?`,
      )
    ) {
      return;
    }

    // Use Promise.allSettled for concurrent deletions and better error handling
    const results = await Promise.allSettled(
      selectedCustomerIds.map(async (id) => {
        await handleDeleteCustomerAction(id);
        if (editingCustomer?.id === id) {
          setEditingCustomer(null);
        }
      }),
    );

    const failedDeletions = results.filter(
      (result) => result.status === 'rejected',
    );
    if (failedDeletions.length > 0) {
      toast.error(
        `Failed to delete ${failedDeletions.length} customer(s). See console for details.`,
      );
      failedDeletions.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(
            `Error deleting customer ${selectedCustomerIds[index]}:`,
            result.reason,
          );
        }
      });
    } else {
      toast.success('Selected customers deleted successfully!');
    }

    setSelectedCustomerIds([]); // Clear selection after bulk delete.
  }, [selectedCustomerIds, handleDeleteCustomerAction, editingCustomer]);

  return (
    <>
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex flex-col gap-6 flex-1">
          {/* Card for Add/Edit Customer Form */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerForm
                // Key ensures form re-mounts when editingCustomer changes, resetting form state.
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

      {/* Card for Customer List and Actions */}
      <Card className="flex-1">
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle className="whitespace-nowrap">Customer List</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto md:ml-auto">
            {/* Search Input */}
            <Input
              type="search"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-auto md:min-w-[250px] lg:min-w-[300px]"
              aria-label="Search customers"
            />
            {/* Category Filter Select */}
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="w-full sm:w-auto p-2 border rounded-md bg-background text-foreground"
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
              <option value="Uncategorized">Uncategorized</option>
            </select>
            {/* Export CSV Button */}
            <Button
              variant="outline"
              onClick={exportCustomersToCSV}
              title="Export customers to CSV"
              className="w-full sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            {/* Bulk Delete Button */}
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={selectedCustomerIds.length === 0}
              title="Delete selected customers"
              className="w-full sm:w-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete Selected (
              {selectedCustomerIds.length})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Display Customer List or Empty State Message */}
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
            <p className="text-muted-foreground text-center py-8">
              {emptyStateContent}
            </p>
          )}
          {/* Pagination Controls */}
          {pageCount > 1 && (
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
              forcePage={currentPage} // Ensure pagination control reflects current page state
            />
          )}
        </CardContent>
      </Card>
    </>
  );
};
