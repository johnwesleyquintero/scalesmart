'use client';
import type { Row, Cell, SortingState } from '@tanstack/react-table';
import React, { useState, useCallback, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Download, Trash2 } from 'lucide-react';
import ReactPaginate from 'react-paginate';
import { toast } from 'sonner';
import useDebounce from '@/hooks/use-debounce';
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
  onEditCustomerAction: (customer: Contact) => void;
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
    useState<SalesStage | null>(null);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  const handleDelete = useCallback(
    async (id: string) => {
      await handleDeleteCustomerAction(id);
    },
    [handleDeleteCustomerAction],
  );

  const columns = useMemo(
    () => [
      {
        header: 'Name',
        accessorKey: 'name',
      },
      {
        header: 'Email',
        accessorKey: 'email',
      },
      {
        header: 'Phone',
        accessorKey: 'phone',
      },
      {
        header: 'Company',
        accessorKey: 'company',
      },
      {
        header: 'Category',
        accessorKey: 'category',
      },
      {
        header: 'Sales Stage',
        accessorKey: 'salesStage',
      },
      {
        header: 'Last Activity',
        accessorKey: 'lastActivity',
        cell: ({ row }: { row: Row<Contact> }) =>
          row.original.lastActivity
            ? new Date(row.original.lastActivity).toLocaleDateString()
            : 'N/A',
      },
      {
        header: 'Tags',
        accessorKey: 'tags',
        cell: ({ row }: { row: Row<Contact> }) => (
          <div>
            {row.original.tags?.map((tag: string) => (
              <span
                key={tag}
                className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2"
              >
                {tag}
              </span>
            ))}
          </div>
        ),
      },
      {
        header: 'Actions',
        cell: ({ row }: { row: Row<Contact> }) => (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditCustomerAction(row.original)}
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(row.original.id)}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [onEditCustomerAction, handleDelete],
  );

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

  const table = useReactTable({
    data: customers,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handlePageClick = (selectedObject: { selected: number }) => {
    setCurrentPage(selectedObject.selected);
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
    selectedSalesStage,
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
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg font-semibold text-muted-foreground">
              No customers found
            </p>
            <p className="text-sm text-muted-foreground">
              Add a new customer or adjust your filters.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="border p-2 text-left cursor-pointer"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                          {{
                            asc: ' 🔼',
                            desc: ' 🔽',
                          }[header.column.getIsSorted() as string] ?? null}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row: Row<Contact>) => (
                    <tr key={row.id}>
                      {row
                        .getVisibleCells()
                        .map((cell: Cell<Contact, unknown>) => (
                          <td key={cell.id} className="border p-2">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
          </>
        )}
      </CardContent>
    </Card>
  );
};
