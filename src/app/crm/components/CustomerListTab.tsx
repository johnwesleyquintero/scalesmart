'use client';

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Download, Trash2 } from 'lucide-react'; // Removed Loader2 as it's now in CustomerListContent
import ReactPaginate from 'react-paginate';
import { toast } from 'sonner';
import useDebounce from '@/hooks/use-debounce';
import { CustomerListContent } from './CustomerListContent'; // Import the extracted component
import type { Contact, CommunicationLog, Category, SalesStage } from '../types';
import {
  filterCustomers,
  generateCustomerCSVData,
} from '../utils/customerUtils';

// Define the possible sales stages for the dropdown
const SALES_STAGES: SalesStage[] = [
  'Lead',
  'Prospect',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Closed Won',
  'Closed Lost',
];

interface CustomerListTabProps {
  customers: Contact[];
  hasAttemptedInitialLoad: boolean;
  categories: Category[];
  handleDeleteCustomerAction: (id: string) => Promise<void>;
  handleCreateCommunicationLogAction: (
    log: Omit<CommunicationLog, 'id'>,
  ) => Promise<void>;
  handleUpdateCommunicationLogAction: (log: CommunicationLog) => Promise<void>;
  handleDeleteCommunicationLogAction: (
    logId: string,
    customerId: string,
  ) => Promise<void>;
  onEditCustomerAction: (customer: Contact) => void; // Prop name already ends with Action
}

interface CustomerListFiltersProps {
  categories: Category[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  selectedCategory: string | null;
  onSelectedCategoryChange: (category: string | null) => void;
  selectedSalesStage: SalesStage | null;
  onSelectedSalesStageChange: (stage: SalesStage | null) => void;
  exportTasksToCSV: () => void;
  handleBulkDelete: () => Promise<void>;
  selectedCustomerIds: string[];
}

const CustomerListFilters: React.FC<CustomerListFiltersProps> = ({
  categories,
  searchQuery,
  onSearchQueryChange,
  selectedCategory,
  onSelectedCategoryChange,
  selectedSalesStage,
  onSelectedSalesStageChange,
  exportTasksToCSV,
  handleBulkDelete,
  selectedCustomerIds,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto md:ml-auto">
      <Input
        type="search"
        placeholder="Search customers..."
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.target.value)}
        className="w-full sm:w-auto md:min-w-[250px] lg:min-w-[300px]"
      />
      <select
        value={selectedCategory || ''}
        onChange={(e) => onSelectedCategoryChange(e.target.value || null)}
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
      <select
        value={selectedSalesStage || ''}
        onChange={(e) =>
          onSelectedSalesStageChange((e.target.value as SalesStage) || null)
        }
        className="w-full sm:w-auto p-2 border rounded-md bg-background text-foreground"
      >
        <option value="">All Sales Stages</option>
        {SALES_STAGES.map((stage) => (
          <option key={stage} value={stage}>
            {stage}
          </option>
        ))}
      </select>
      <Button
        variant="outline"
        onClick={exportTasksToCSV}
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
  );
};

export const CustomerListTab: React.FC<CustomerListTabProps> = ({
  customers,
  hasAttemptedInitialLoad,
  categories,
  handleDeleteCustomerAction,
  handleCreateCommunicationLogAction,
  handleUpdateCommunicationLogAction,
  handleDeleteCommunicationLogAction,
  onEditCustomerAction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(5);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSalesStage, setSelectedSalesStage] =
    useState<SalesStage | null>(null); // New state for sales stage filter
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);

  const handlePageClick = (selectedObject: { selected: number }) => {
    setCurrentPage(selectedObject.selected);
  };

  const handleDelete = async (id: string) => {
    await handleDeleteCustomerAction(id);
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
    selectedSalesStage, // Pass the new sales stage filter
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

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedCustomerIds.length} selected customers?`,
    );

    if (!confirmed) {
      return;
    }

    for (const id of selectedCustomerIds) {
      await handleDeleteCustomerAction(id);
    }

    setSelectedCustomerIds([]);
    toast.success('Selected customers deleted successfully!');
  };

  return (
    <Card className="flex-1">
      <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <CardTitle className="whitespace-nowrap">Customer List</CardTitle>
        <CustomerListFilters
          categories={categories}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onSelectedCategoryChange={setSelectedCategory}
          selectedSalesStage={selectedSalesStage}
          onSelectedSalesStageChange={setSelectedSalesStage}
          exportTasksToCSV={exportTasksToCSV}
          handleBulkDelete={handleBulkDelete}
          selectedCustomerIds={selectedCustomerIds}
        />
      </CardHeader>
      <CardContent>
        <CustomerListContent
          customers={filteredCustomers}
          searchQuery={searchQuery}
          hasAttemptedInitialLoad={hasAttemptedInitialLoad}
          onEditAction={onEditCustomerAction} // Pass with new prop name
          onDeleteAction={handleDelete} // Pass with new prop name
          onCopyNotesAction={handleCopyToClipboard} // Pass with new prop name
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onCommunicationLogSaveAction={handleCreateCommunicationLogAction}
          onCommunicationLogUpdateAction={handleUpdateCommunicationLogAction}
          onCommunicationLogDeleteAction={handleDeleteCommunicationLogAction}
          selectedCustomerIds={selectedCustomerIds}
          onSelectAction={handleSelectCustomer} // Pass with new prop name
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
  );
};
