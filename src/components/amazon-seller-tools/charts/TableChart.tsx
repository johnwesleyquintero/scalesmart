import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Filter,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { INDEXED_DB_TABLE_CHART_STATE_KEY } from '@/lib/constants';
import { setItem, getItem, deleteItem } from '@/lib/indexeddb-service';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { useToast } from '../../ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { useRouter } from 'next/navigation';

/**
 * Defines the structure for a column in the TableChart component.
 * @template TData The type of the data objects in the table.
 */
export interface ColumnDef<TData> {
  /**
   * The key in the data object to access the value for this column.
   * Can be a direct keyof TData or a string for nested/dynamic access.
   */
  accessorKey: keyof TData | string;
  /**
   * The content to display in the table header for this column.
   * Can be a string or a ReactNode for custom rendering.
   */
  header: string | React.ReactNode;
  /**
   * An optional function to customize the rendering of a cell's content.
   * Receives the cell's value, the full row data, and the column definition itself.
   * @param value The raw value from the data object for this cell.
   * @param row The entire data object for the current row.
   * @param column The column definition object for the current column.
   * @returns A ReactNode to render in the cell.
   */
  cell?: (
    value: TData[keyof TData],
    row: TData,
    column: ColumnDef<TData>,
  ) => React.ReactNode;
  /**
   * If true, enables client-side sorting for this column.
   * Clicking the header will toggle sorting direction.
   */
  sortable?: boolean;
  enableColumnFilter?: boolean;
  filterType?: 'text' | 'number' | 'select' | 'dateRange';
  defaultFilterOperator?: FilterOperator;
  /**
   * An optional custom sort function for this column.
   * Overrides default sorting if provided.
   */
  sortFn?: (a: TData, b: TData, columnId: string) => number;
  /**
   * Specifies a predefined sort type for the column.
   * Used if `sortFn` is not provided.
   */
  sortType?: 'string' | 'number' | 'date' | 'alphanumeric' | 'currency';
  /**
   * If true, enables copy-to-clipboard functionality for this column's cells.
   */
  copyable?: boolean;
  /**
   * An optional configuration to enable "Analyze in Tool" functionality.
   * Specifies the target tool (tab) and the query parameter name.
   */
  analyzeInTool?: {
    toolName: string; // e.g., 'competitor-analyzer', 'keyword-analyzer'
    paramName: string; // e.g., 'asin', 'keyword'
  };
}

export type FilterOperator =
  | 'contains'
  | 'equals'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'between'
  | 'isEmpty'
  | 'isNotEmpty';

/**
 * Props for the reusable TableChart component.
 */
export interface TableChartProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  stripedRows?: boolean;
  compact?: boolean;
  className?: string;
  enablePagination?: boolean;
  initialPageSize?: number;
  enableFiltering?: boolean;
  filterColumns?: string[];
  enableRowSelection?: boolean;
  rowIdAccessor?: (row: TData) => string | number;
  onRowSelectionChange?: (selectedRows: TData[]) => void;
  renderSubComponent?: (row: TData) => React.ReactNode;
  isLoading?: boolean;
  emptyStateContent?: React.ReactNode;
  persistenceKey?: string;
  onResetPreferences?: () => void; // Callback for resetting preferences
}

interface PersistedTableState {
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  itemsPerPage: number;
  globalFilter: string;
  columnFilters: Record<
    string,
    { value: unknown; type: string; operator: FilterOperator }
  >;
}

/**
 * A versatile Table Chart component with sorting, pagination, filtering, and more.
 */
const TableChart = <TData extends Record<string, unknown>>({
  data,
  columns,
  stripedRows = false,
  compact = false,
  className = '',
  enablePagination = false,
  initialPageSize = 10,
  enableFiltering = false,
  filterColumns,
  enableRowSelection = false,
  rowIdAccessor,
  onRowSelectionChange,
  renderSubComponent,
  isLoading = false,
  emptyStateContent = 'No data available.',
  persistenceKey,
  onResetPreferences,
}: TableChartProps<TData>) => {
  const router = useRouter();
  // Ensure all states are within the component's scope
  const [sortConfig, setSortConfig] = useState<{
    key: keyof TData | string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialPageSize);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [columnFilters, setColumnFilters] = useState<
    Record<string, { value: unknown; type: string; operator: FilterOperator }>
  >({});
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string | number>>(
    new Set(),
  );
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string | number>>(
    new Set(),
  );

  // Memoize unique values for select filters to improve performance
  const memoizedSelectOptions = useMemo(() => {
    const options: Record<string, string[]> = {};
    columns.forEach((col) => {
      if (col.filterType === 'select') {
        options[col.accessorKey as string] = Array.from(
          new Set(
            data.map((row) => String(row[col.accessorKey as keyof TData])),
          ),
        ).sort(); // Sort options for better UX
      }
    });
    return options;
  }, [data, columns]);

  const resetTablePreferences = () => {
    setSortConfig(null);
    setCurrentPage(1);
    setItemsPerPage(initialPageSize);
    setGlobalFilter('');
    setColumnFilters({});
    setSelectedRowIds(new Set());
    setExpandedRowIds(new Set());

    if (persistenceKey) {
      deleteItem(INDEXED_DB_TABLE_CHART_STATE_KEY, persistenceKey).catch(
        (error: IDBRequest['error']) =>
          console.error('Failed to remove table state from IndexedDB:', error),
      );
    }
    onResetPreferences && onResetPreferences();
  };

  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    if (
      process.env.NODE_ENV === 'development' &&
      (enableRowSelection || renderSubComponent) // Referencing destructured props
    ) {
      if (!rowIdAccessor) {
        console.warn(
          'TableChart: rowIdAccessor is required when enableRowSelection or renderSubComponent is true.',
        );
      } else {
        const ids = new Set();
        const duplicates: (string | number)[] = [];
        data.forEach((row) => {
          const id = rowIdAccessor(row);
          if (ids.has(id)) {
            duplicates.push(id);
          } else {
            ids.add(id);
          }
        });
        if (duplicates.length > 0) {
          console.warn(
            `TableChart: Duplicate rowIdAccessor values found. Duplicates: ${[
              ...new Set(duplicates),
            ].join(', ')}`,
          );
        }
      }
    }
  }, [enableRowSelection, renderSubComponent, rowIdAccessor, data]);

  // Load state from IndexedDB on mount
  useEffect(() => {
    if (!persistenceKey) return;

    getItem<PersistedTableState>(
      `${INDEXED_DB_TABLE_CHART_STATE_KEY}-${persistenceKey}`,
    )
      .then((savedState: PersistedTableState | undefined) => {
        if (savedState) {
          setSortConfig(savedState.sortConfig);
          setItemsPerPage(savedState.itemsPerPage);
          setGlobalFilter(savedState.globalFilter);
          setColumnFilters(savedState.columnFilters);
        }
      })
      .catch((error: unknown) =>
        console.error('Failed to load table state from IndexedDB:', error),
      );
  }, [persistenceKey]);

  // Save state to IndexedDB when relevant state changes
  useEffect(() => {
    if (!persistenceKey) return;

    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }

    saveTimer.current = window.setTimeout(() => {
      const stateToSave: PersistedTableState = {
        sortConfig: sortConfig as PersistedTableState['sortConfig'],
        itemsPerPage,
        globalFilter,
        columnFilters,
      };
      setItem(
        INDEXED_DB_TABLE_CHART_STATE_KEY,
        persistenceKey,
        stateToSave,
      ).catch((error: unknown) =>
        console.error('Failed to save table state to IndexedDB:', error),
      );
    }, 500);

    return () => {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
      }
    };
  }, [sortConfig, itemsPerPage, globalFilter, columnFilters, persistenceKey]);

  // Effect to call onRowSelectionChange when selectedRowIds or data changes
  useEffect(() => {
    console.log(
      'useEffect: onRowSelectionChange triggered, rowIdAccessor status:',
      rowIdAccessor ? 'defined' : 'undefined',
    );
    if (onRowSelectionChange) {
      const currentlySelectedRows = data.filter((row) => {
        if (rowIdAccessor) {
          return selectedRowIds.has(rowIdAccessor(row));
        }
        return false;
      });
      onRowSelectionChange(currentlySelectedRows);
    }
  }, [selectedRowIds, data, onRowSelectionChange, rowIdAccessor]);

  // Clear expanded rows if data changes significantly (e.g., filter/sort changes)
  useEffect(() => {
    setExpandedRowIds(new Set());
  }, [data, globalFilter, sortConfig, columnFilters]);

  const applyNumberFilterLogic = (
    numValue: number,
    filterValue: unknown,
    operator: FilterOperator,
  ) => {
    const numFilterValue = Number(filterValue);
    if (isNaN(numValue) || isNaN(numFilterValue)) return false;

    switch (operator) {
      case 'equals':
        return numValue === numFilterValue;
      case 'greaterThan':
        return numValue > numFilterValue;
      case 'lessThan':
        return numValue < numFilterValue;
      case 'between': {
        const [min, max] = filterValue as [number, number];
        return numValue >= min && numValue <= max;
      }
      default:
        return false;
    }
  };

  const applyDateRangeFilterLogic = (
    value: unknown,
    filterValue: unknown,
    operator: FilterOperator,
  ) => {
    const dateValue = new Date(value as string);
    const filterValues = filterValue as [string, string];
    const startDate = new Date(filterValues[0]);
    const endDate = new Date(filterValues[1]);

    if (isNaN(dateValue.getTime())) return false;

    switch (operator) {
      case 'equals':
        return dateValue.toDateString() === startDate.toDateString();
      case 'greaterThan':
        return dateValue.getTime() > startDate.getTime();
      case 'lessThan':
        return dateValue.getTime() < startDate.getTime();
      case 'between':
        return (
          dateValue.getTime() >= startDate.getTime() &&
          dateValue.getTime() <= endDate.getTime()
        );
      default:
        return false;
    }
  };

  const applyTextFilterLogic = (
    cellValue: string,
    filterValue: string,
    operator: FilterOperator,
  ) => {
    switch (operator) {
      case 'contains':
        return cellValue.includes(filterValue);
      case 'equals':
        return cellValue === filterValue;
      case 'startsWith':
        return cellValue.startsWith(filterValue);
      case 'endsWith':
        return cellValue.endsWith(filterValue);
      default:
        return false;
    }
  };

  const applySelectFilterLogic = (cellValue: string, filterValue: string) => {
    return cellValue === filterValue;
  };

  const filteredData = useMemo(() => {
    let currentFilteredData = data;

    // Apply global filter
    if (enableFiltering && globalFilter) {
      const filterLower = globalFilter.toLowerCase();
      const columnsToFilter = columns.filter((column) =>
        filterColumns
          ? filterColumns.includes(column.accessorKey as string)
          : true,
      );

      currentFilteredData = currentFilteredData.filter((row) => {
        return columnsToFilter.some((column) => {
          const value = row[column.accessorKey as keyof TData];
          return String(value ?? '')
            .toLowerCase()
            .includes(filterLower);
        });
      });
    }

    const applyColumnFilter = (
      row: TData,
      columnId: string,
      filter: { value: unknown; type: string; operator: FilterOperator },
    ) => {
      const value = row[columnId as keyof TData];
      const filterValue = String(filter.value).toLowerCase();
      const cellValue = String(value ?? '').toLowerCase();
      const operator = filter.operator;

      // Handle isEmpty and isNotEmpty for all types
      if (operator === 'isEmpty') {
        return (
          value === null || value === undefined || String(value).trim() === ''
        );
      }
      if (operator === 'isNotEmpty') {
        return (
          value !== null && value !== undefined && String(value).trim() !== ''
        );
      }

      // For other operators, value must be present
      if (value === null || value === undefined) {
        return false;
      }

      switch (filter.type) {
        case 'number':
          return applyNumberFilterLogic(Number(value), filter.value, operator);
        case 'select':
          return applySelectFilterLogic(cellValue, filterValue);
        case 'dateRange':
          return applyDateRangeFilterLogic(value, filter.value, operator);
        case 'text':
        default:
          return applyTextFilterLogic(cellValue, filterValue, operator);
      }
    };

    currentFilteredData = currentFilteredData.filter((row) => {
      return Object.entries(columnFilters).every(([columnId, filter]) => {
        const column = columns.find((col) => col.accessorKey === columnId);
        if (!column || !column.enableColumnFilter) {
          return true;
        }
        return applyColumnFilter(row, columnId, filter);
      });
    });

    return currentFilteredData;
  }, [
    data,
    columns,
    globalFilter,
    enableFiltering,
    filterColumns,
    columnFilters,
  ]);

  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const column = columns.find(
          (col) => col.accessorKey === sortConfig.key,
        );

        if (column?.sortFn) {
          return sortConfig.direction === 'asc'
            ? column.sortFn(a, b, sortConfig.key as string)
            : -column.sortFn(a, b, sortConfig.key as string);
        }

        const valA = a[sortConfig.key as keyof TData];
        const valB = b[sortConfig.key as keyof TData];

        const compareNumbers = (v1: unknown, v2: unknown): number => {
          const numA = Number(v1);
          const numB = Number(v2);
          if (isNaN(numA) && isNaN(numB)) return 0;
          if (isNaN(numA)) return sortConfig.direction === 'asc' ? 1 : -1;
          if (isNaN(numB)) return sortConfig.direction === 'asc' ? -1 : 1;
          return numA - numB;
        };

        const compareDates = (v1: unknown, v2: unknown): number => {
          const dateA = v1 ? new Date(v1 as string).getTime() : NaN;
          const dateB = v2 ? new Date(v2 as string).getTime() : NaN;
          if (isNaN(dateA) && isNaN(dateB)) return 0;
          if (isNaN(dateA)) return sortConfig.direction === 'asc' ? 1 : -1;
          if (isNaN(dateB)) return sortConfig.direction === 'asc' ? -1 : 1;
          return dateA - dateB;
        };

        const compareCurrencies = (v1: unknown, v2: unknown): number => {
          const numA = parseFloat(String(v1).replace(/[^0-9.-]+/g, '')) || NaN;
          const numB = parseFloat(String(v2).replace(/[^0-9.-]+/g, '')) || NaN;

          if (isNaN(numA) && isNaN(numB)) return 0;
          if (isNaN(numA)) return sortConfig.direction === 'asc' ? 1 : -1;
          if (isNaN(numB)) return sortConfig.direction === 'asc' ? -1 : 1;
          return numA - numB;
        };

        const compareAlphanumeric = (v1: unknown, v2: unknown): number => {
          const strA = String(v1 ?? '');
          const strB = String(v2 ?? '');
          return strA.localeCompare(strB, undefined, {
            numeric: true,
            sensitivity: 'base',
          });
        };

        // Main compare function acting as a dispatcher
        const compareValues = (
          v1: unknown,
          v2: unknown,
          type: ColumnDef<TData>['sortType'],
        ): number => {
          switch (type) {
            case 'number':
              return compareNumbers(v1, v2);
            case 'date':
              return compareDates(v1, v2);
            case 'currency':
              return compareCurrencies(v1, v2);
            case 'alphanumeric':
              return compareAlphanumeric(v1, v2);
            case 'string':
            default:
              return String(v1 ?? '').localeCompare(String(v2 ?? ''));
          }
        };

        const result = compareValues(valA, valB, column?.sortType);
        return sortConfig.direction === 'asc' ? result : -result;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig, columns]);

  const paginatedData = useMemo(() => {
    if (!enablePagination) {
      return sortedData;
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, itemsPerPage, enablePagination]);

  const totalPages = enablePagination
    ? Math.ceil(sortedData.length / itemsPerPage)
    : 1;

  const requestSort = (key: keyof TData | string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'asc'
    ) {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleColumnFilterChange = (
    columnId: string,
    value: unknown,
    type: string = 'text',
    operator: FilterOperator = 'contains', // Default operator
  ) => {
    setColumnFilters((prev) => {
      const newFilters = { ...prev };
      if (value || operator === 'isEmpty' || operator === 'isNotEmpty') {
        newFilters[columnId] = { value, type, operator };
      } else {
        delete newFilters[columnId];
      }
      return newFilters;
    });
    setCurrentPage(1);
  };

  const renderFilterInput = (column: ColumnDef<TData>) => {
    if (!column.enableColumnFilter) return null;

    const columnFilter = columnFilters[column.accessorKey as string];
    const columnFilterValue = columnFilter?.value;
    const columnFilterOperator =
      columnFilter?.operator || column.defaultFilterOperator || 'contains';

    const commonInputClasses =
      'w-full text-xs p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500';
    const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

    const getOperatorOptions = (filterType: ColumnDef<TData>['filterType']) => {
      if (filterType === 'number' || filterType === 'dateRange') {
        return (
          <>
            <option value="equals">Equals</option>
            <option value="greaterThan">Greater Than</option>
            <option value="lessThan">Less Than</option>
            <option value="between">Between</option>
          </>
        );
      } else {
        return (
          <>
            <option value="contains">Contains</option>
            <option value="equals">Equals</option>
            <option value="startsWith">Starts With</option>
            <option value="endsWith">Ends With</option>
          </>
        );
      }
    };

    const renderOperatorSelect = (currentType: string) => (
      <select
        value={columnFilterOperator}
        onChange={(e) =>
          handleColumnFilterChange(
            column.accessorKey as string,
            columnFilterValue,
            currentType,
            e.target.value as FilterOperator,
          )
        }
        className={`${commonInputClasses} mb-1`}
        onClick={stopPropagation}
      >
        {getOperatorOptions(column.filterType)}
        <option value="isEmpty">Is Empty</option>
        <option value="isNotEmpty">Is Not Empty</option>
      </select>
    );

    const renderSingleInput = (type: 'text' | 'number' | 'date') => (
      <input
        type={type}
        placeholder={`Filter ${type === 'date' ? 'Date (YYYY-MM-DD)' : '...'}`}
        value={String(columnFilterValue ?? '')}
        onChange={(e) =>
          handleColumnFilterChange(
            column.accessorKey as string,
            e.target.value,
            column.filterType,
            columnFilterOperator,
          )
        }
        className={commonInputClasses}
        onClick={stopPropagation}
      />
    );

    const renderBetweenInputs = (type: 'number' | 'date') => (
      <div className="flex space-x-1">
        <input
          type={type}
          placeholder={type === 'number' ? 'Min' : 'Start Date'}
          value={
            Array.isArray(columnFilterValue)
              ? String(columnFilterValue[0] ?? '')
              : ''
          }
          onChange={(e) =>
            handleColumnFilterChange(
              column.accessorKey as string,
              [
                type === 'number' ? Number(e.target.value) : e.target.value,
                (columnFilterValue as (string | number)[])?.[1],
              ],
              column.filterType,
              columnFilterOperator,
            )
          }
          className={commonInputClasses}
          onClick={stopPropagation}
        />
        <input
          type={type}
          placeholder={type === 'number' ? 'Max' : 'End Date'}
          value={
            Array.isArray(columnFilterValue)
              ? String(columnFilterValue[1] ?? '')
              : ''
          }
          onChange={(e) =>
            handleColumnFilterChange(
              column.accessorKey as string,
              [
                (columnFilterValue as (string | number)[])?.[0],
                type === 'number' ? Number(e.target.value) : e.target.value,
              ],
              column.filterType,
              columnFilterOperator,
            )
          }
          className={commonInputClasses}
          onClick={stopPropagation}
        />
      </div>
    );

    const renderSelectInput = () => {
      const uniqueValues =
        memoizedSelectOptions[column.accessorKey as string] || [];
      return (
        <select
          value={String(columnFilterValue ?? '')}
          onChange={(e) =>
            handleColumnFilterChange(
              column.accessorKey as string,
              e.target.value,
              'select',
              columnFilterOperator,
            )
          }
          className={commonInputClasses}
          onClick={stopPropagation}
        >
          <option value="">All</option>
          {uniqueValues.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      );
    };

    const isBetween = columnFilterOperator === 'between';

    return (
      <div className="flex flex-col space-y-1">
        {renderOperatorSelect(column.filterType || 'text')}
        {columnFilterOperator !== 'isEmpty' &&
          columnFilterOperator !== 'isNotEmpty' && (
            <>
              {column.filterType === 'number' &&
                (isBetween
                  ? renderBetweenInputs('number')
                  : renderSingleInput('number'))}
              {column.filterType === 'dateRange' &&
                (isBetween
                  ? renderBetweenInputs('date')
                  : renderSingleInput('date'))}
              {column.filterType === 'select' && renderSelectInput()}
              {column.filterType === 'text' && renderSingleInput('text')}
            </>
          )}
      </div>
    );
  };

  const tableClasses = `min-w-full divide-y divide-gray-200 border border-gray-200 ${className}`;
  const rowClasses = (rowIndex: number, isSelected: boolean) =>
    `${stripedRows && rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'} ${
      isSelected ? 'bg-blue-100' : ''
    } hover:bg-gray-100 ${compact ? 'py-2' : 'py-4'} divide-y divide-gray-200`;
  const cellPadding = compact ? 'px-4 py-2' : 'px-6 py-4';

  const { toast } = useToast();

  const handleCopyToClipboard = async (value: string, header: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: `Copied to clipboard`,
        description: `${header}: "${value}"`,
      });
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: `Could not copy ${header} to clipboard.`,
        variant: 'destructive',
      });
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const toggleRowExpansion = (rowId: string | number) => {
    console.log(
      'toggleRowExpansion: rowIdAccessor status:',
      rowIdAccessor ? 'defined' : 'undefined',
    );
    setExpandedRowIds((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(rowId)) {
        newExpanded.delete(rowId);
      } else {
        newExpanded.add(rowId);
      }
      return newExpanded;
    });
  };

  const handleRowSelect = (rowId: string | number, isSelected: boolean) => {
    console.log(
      'handleRowSelect: rowIdAccessor status:',
      rowIdAccessor ? 'defined' : 'undefined',
      'rowId:',
      rowId,
      'isSelected:',
      isSelected,
    );
    setSelectedRowIds((prev) => {
      const newSelection = new Set(prev);
      if (isSelected) {
        newSelection.add(rowId);
      } else {
        newSelection.delete(rowId);
      }
      return newSelection;
    });
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log(
      'handleSelectAll: rowIdAccessor status:',
      rowIdAccessor ? 'defined' : 'undefined',
      'isChecked:',
      event.target.checked,
    );
    const isChecked = event.target.checked;
    setSelectedRowIds((prev) => {
      const newSelection = new Set(prev);
      if (isChecked) {
        if (rowIdAccessor) {
          paginatedData.forEach((row) => newSelection.add(rowIdAccessor(row)));
        }
      } else {
        if (rowIdAccessor) {
          paginatedData.forEach((row) =>
            newSelection.delete(rowIdAccessor(row)),
          );
        }
      }
      return newSelection;
    });
  };

  const allRowsSelectedOnCurrentPage = useMemo(() => {
    if (!enableRowSelection || !rowIdAccessor || paginatedData.length === 0) {
      return false;
    }
    return paginatedData.every((row) => selectedRowIds.has(rowIdAccessor(row)));
  }, [enableRowSelection, rowIdAccessor, paginatedData, selectedRowIds]);

  const someRowsSelectedOnCurrentPage = useMemo(() => {
    if (!enableRowSelection || !rowIdAccessor || paginatedData.length === 0) {
      return false;
    }
    return (
      paginatedData.some((row) => selectedRowIds.has(rowIdAccessor(row))) &&
      !allRowsSelectedOnCurrentPage
    );
  }, [
    enableRowSelection,
    rowIdAccessor,
    paginatedData,
    selectedRowIds,
    allRowsSelectedOnCurrentPage,
  ]);

  return (
    <div
      className={`overflow-x-auto shadow-sm rounded-lg relative ${
        isLoading ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 bg-opacity-75 z-10 rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
          <span className="sr-only">Loading...</span>
        </div>
      )}

      {enableFiltering && (
        <div className="mb-4 p-2 border border-gray-200 dark:border-gray-700 rounded-t-lg bg-white dark:bg-gray-800 flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search all columns..."
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            aria-label="Global filter search input"
          />
          {persistenceKey && (
            <button
              onClick={resetTablePreferences}
              className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Reset table preferences"
            >
              Reset
            </button>
          )}
        </div>
      )}
      <table className={tableClasses} role="grid">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr role="row">
            {enableRowSelection && (
              <th
                scope="col"
                className={`w-12 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider ${cellPadding}`}
              >
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-blue-600"
                  onChange={handleSelectAll}
                  checked={allRowsSelectedOnCurrentPage}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = someRowsSelectedOnCurrentPage;
                    }
                  }}
                  aria-label="Select all rows on current page"
                />
              </th>
            )}
            {renderSubComponent && (
              <th
                scope="col"
                className={`w-12 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider ${cellPadding}`}
              >
                {/* Empty header for expand/collapse column */}
              </th>
            )}
            {columns.map((column, index) => (
              <th
                key={column.accessorKey.toString() || index}
                scope="col"
                className={`text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider ${cellPadding} ${
                  column.sortable ? 'cursor-pointer select-none' : ''
                }`}
                onClick={() =>
                  column.sortable && requestSort(column.accessorKey)
                }
                aria-sort={
                  column.sortable && sortConfig?.key === column.accessorKey
                    ? sortConfig.direction === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
                tabIndex={column.sortable ? 0 : -1}
              >
                <div className="flex items-center justify-between">
                  <span
                    onClick={
                      column.sortable
                        ? undefined
                        : (e: React.MouseEvent) => e.stopPropagation()
                    }
                  >
                    {column.header}
                  </span>
                  <div className="flex items-center ml-1">
                    {column.sortable && (
                      <>
                        {sortConfig?.key === column.accessorKey &&
                          sortConfig.direction === 'asc' && (
                            <ChevronUp
                              className="h-4 w-4 text-gray-700 dark:text-gray-300"
                              aria-hidden="true"
                            />
                          )}
                        {sortConfig?.key === column.accessorKey &&
                          sortConfig.direction === 'desc' && (
                            <ChevronDown
                              className="h-4 w-4 text-gray-700 dark:text-gray-300"
                              aria-hidden="true"
                            />
                          )}
                        {sortConfig?.key !== column.accessorKey && (
                          <ChevronUp
                            className="h-4 w-4 text-gray-300 dark:text-gray-600"
                            aria-hidden="true"
                          />
                        )}
                      </>
                    )}
                    {column.enableColumnFilter && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            className="ml-2 p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Filter column ${column.header}`}
                          >
                            <Filter className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-48 p-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                          onClick={(e: { stopPropagation: () => unknown }) =>
                            e.stopPropagation()
                          }
                        >
                          {renderFilterInput(column)}
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {paginatedData.length === 0 && !isLoading ? (
            <tr>
              <td
                colSpan={
                  columns.length +
                  (enableRowSelection ? 1 : 0) +
                  (renderSubComponent ? 1 : 0)
                }
                className={`text-center ${cellPadding} text-gray-500 dark:text-gray-400`}
              >
                {emptyStateContent}
              </td>
            </tr>
          ) : (
            paginatedData.map((row, rowIndex) => {
              const rowId = rowIdAccessor ? rowIdAccessor(row) : rowIndex;
              const isSelected = selectedRowIds.has(rowId);
              const isExpanded = expandedRowIds.has(rowId);
              const totalColumns =
                columns.length +
                (enableRowSelection ? 1 : 0) +
                (renderSubComponent ? 1 : 0);

              return (
                <React.Fragment key={rowId !== undefined ? rowId : rowIndex}>
                  <tr
                    className={`${
                      stripedRows && rowIndex % 2 === 0
                        ? 'bg-gray-50 dark:bg-gray-700'
                        : 'bg-white dark:bg-gray-800'
                    } ${
                      isSelected ? 'bg-blue-100 dark:bg-blue-900' : ''
                    } hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      compact ? 'py-2' : 'py-4'
                    } divide-y divide-gray-200 dark:divide-gray-700`}
                    role="row"
                  >
                    {enableRowSelection && (
                      <td
                        className={`text-center ${cellPadding}`}
                        role="gridcell"
                      >
                        <input
                          type="checkbox"
                          className="form-checkbox h-4 w-4 text-blue-600"
                          checked={isSelected}
                          onChange={(e) =>
                            rowId !== undefined &&
                            handleRowSelect(rowId, e.target.checked)
                          }
                          aria-label={`Select row ${rowId}`}
                        />
                      </td>
                    )}
                    {renderSubComponent && rowId !== undefined && (
                      <td
                        className={`text-center ${cellPadding}`}
                        role="gridcell"
                      >
                        <button
                          onClick={() => toggleRowExpansion(rowId)}
                          className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
                          aria-expanded={isExpanded}
                          aria-controls={`details-row-${rowId}`}
                          aria-label={
                            isExpanded ? 'Collapse row' : 'Expand row'
                          }
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    )}
                    {columns.map((column, colIndex) => {
                      const value = row[column.accessorKey as keyof TData];
                      return (
                        <td
                          key={column.accessorKey.toString() + colIndex}
                          className={`whitespace-nowrap text-sm text-gray-800 dark:text-gray-200 ${cellPadding} ${column.copyable || column.analyzeInTool ? 'group relative flex items-center justify-between' : ''}`}
                          role="gridcell"
                        >
                          {column.cell
                            ? column.cell(
                                value,
                                row,
                                column as ColumnDef<TData>,
                              )
                            : String(value)}
                          {(column.copyable || column.analyzeInTool) &&
                            (typeof value === 'string' ||
                              typeof value === 'number') && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 -mr-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <ExternalLink className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                                  {column.copyable && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleCopyToClipboard(
                                          String(value),
                                          column.header as string,
                                        )
                                      }
                                    >
                                      <Copy className="mr-2 h-4 w-4" /> Copy
                                      &quot;
                                      {value}&quot;
                                    </DropdownMenuItem>
                                  )}
                                  {column.analyzeInTool && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        const toolName =
                                          column.analyzeInTool?.toolName;
                                        const paramName =
                                          column.analyzeInTool?.paramName;
                                        if (toolName && paramName) {
                                          router.push(
                                            `/amazon-seller-tools?tab=${toolName}&${paramName}=${encodeURIComponent(
                                              String(value),
                                            )}`,
                                          );
                                        }
                                      }}
                                    >
                                      <ExternalLink className="mr-2 h-4 w-4" />{' '}
                                      Analyze in{' '}
                                      {column.analyzeInTool.toolName
                                        .charAt(0)
                                        .toUpperCase() +
                                        column.analyzeInTool.toolName.slice(1)}
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                        </td>
                      );
                    })}
                  </tr>
                  {isExpanded && renderSubComponent && (
                    <tr id={`details-row-${rowId}`} role="row">
                      <td
                        colSpan={totalColumns}
                        className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        {renderSubComponent(row)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
      {/* Moved toast to root layout. This element is not necessary. */}

      {enablePagination && totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 px-4 py-2 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-700 rounded-b-lg text-gray-700 dark:text-gray-300">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            Previous
          </button>
          <span
            className="text-sm text-gray-700 dark:text-gray-300"
            aria-live="polite"
          >
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TableChart;
