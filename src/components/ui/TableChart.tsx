import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, Filter } from 'lucide-react';
import { setItem, getItem, deleteItem } from '../../../lib/indexeddb-service';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'; // Assuming Popover component path

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
  /**
   * If true, enables client-side filtering for this specific column.
   * A filter UI will be displayed in the header.
   */
  enableColumnFilter?: boolean;
  /**
   * Specifies the type of filter UI to render for this column.
   * 'text' for text input, 'number' | 'select' | 'dateRange'.
   * If not specified, defaults to 'text'.
   */
  filterType?: 'text' | 'number' | 'select' | 'dateRange';
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
}

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
  columnFilters: Record<string, { value: unknown; type: string }>;
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
  renderSubComponent, // Re-add this here
  isLoading = false,
  emptyStateContent = 'No data available.',
  persistenceKey,
  onResetPreferences,
}: TableChartProps<TData>) => {
  // Ensure all states are within the component's scope
  const [sortConfig, setSortConfig] = useState<{
    key: keyof TData | string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialPageSize);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [columnFilters, setColumnFilters] = useState<
    Record<string, { value: unknown; type: string }>
  >({});
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string | number>>(
    new Set(),
  );
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string | number>>(
    new Set(),
  );

  const resetTablePreferences = () => {
    setSortConfig(null);
    setCurrentPage(1);
    setItemsPerPage(initialPageSize);
    setGlobalFilter('');
    setColumnFilters({});
    setSelectedRowIds(new Set());
    setExpandedRowIds(new Set());

    if (persistenceKey) {
      deleteItem(`tableState_${persistenceKey}`).catch((error) =>
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

    getItem<PersistedTableState>(`tableState_${persistenceKey}`)
      .then((savedState) => {
        if (savedState) {
          setSortConfig(savedState.sortConfig);
          setItemsPerPage(savedState.itemsPerPage);
          setGlobalFilter(savedState.globalFilter);
          setColumnFilters(savedState.columnFilters);
        }
      })
      .catch((error) =>
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
      setItem(`tableState_${persistenceKey}`, stateToSave).catch((error) =>
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

  const filteredData = useMemo(() => {
    let currentFilteredData = data;

    // Apply global filter
    if (enableFiltering && globalFilter) {
      const filterLower = globalFilter.toLowerCase();
      const columnsToFilter = filterColumns
        ? columns.filter((column) =>
            filterColumns.includes(column.accessorKey as string),
          )
        : columns;

      currentFilteredData = currentFilteredData.filter((row) => {
        return columnsToFilter.some((column) => {
          const value = row[column.accessorKey as keyof TData];
          return String(value ?? '')
            .toLowerCase()
            .includes(filterLower);
        });
      });
    }

    // Apply per-column filters
    currentFilteredData = currentFilteredData.filter((row) => {
      return Object.entries(columnFilters).every(([columnId, filter]) => {
        if (!filter || !filter.value) {
          return true;
        }
        const column = columns.find((col) => col.accessorKey === columnId);
        if (!column || !column.enableColumnFilter) {
          return true;
        }

        const value = row[columnId as keyof TData];
        const filterValue = String(filter.value).toLowerCase();
        const cellValue = String(value ?? '').toLowerCase();

        switch (filter.type) {
          case 'number':
            return Number(value) === Number(filter.value);
          case 'select':
            return cellValue === filterValue;
          case 'dateRange':
            // @todo: Implement date range filtering
            return true;
          case 'text':
          default:
            return cellValue.includes(filterValue);
        }
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

        const aValue = valA ?? ''; // Default to empty string for null/undefined
        const bValue = valB ?? ''; // Default to empty string for null/undefined

        const compareNumbers = (v1: unknown, v2: unknown): number => {
          return Number(v1) - Number(v2);
        };

        const compareDates = (v1: unknown, v2: unknown): number => {
          const dateA = v1 ? new Date(v1 as string).getTime() : 0;
          const dateB = v2 ? new Date(v2 as string).getTime() : 0;
          return dateA - dateB;
        };

        const compareCurrencies = (
          v1: unknown,
          v2: unknown,
          sortDirection: 'asc' | 'desc',
        ): number => {
          const numA = parseFloat(String(v1).replace(/[^0-9.-]+/g, ''));
          const numB = parseFloat(String(v2).replace(/[^0-9.-]+/g, ''));

          if (isNaN(numA) && isNaN(numB)) return 0;
          if (isNaN(numA)) return sortDirection === 'asc' ? 1 : -1;
          if (isNaN(numB)) return sortDirection === 'asc' ? -1 : 1;
          return numA - numB;
        };

        const compareAlphanumeric = (v1: unknown, v2: unknown): number => {
          return String(v1).localeCompare(String(v2), undefined, {
            numeric: true,
            sensitivity: 'base',
          });
        };

        // Main compare function acting as a dispatcher
        const compareValues = (
          v1: unknown,
          v2: unknown,
          type: ColumnDef<TData>['sortType'],
          sortDirection: 'asc' | 'desc',
        ): number => {
          switch (type) {
            case 'number':
              return compareNumbers(v1, v2);
            case 'date':
              return compareDates(v1, v2);
            case 'currency':
              return compareCurrencies(v1, v2, sortDirection);
            case 'alphanumeric':
              return compareAlphanumeric(v1, v2);
            default: // Handles 'string' or undefined sortType
              return String(v1).localeCompare(String(v2));
          }
        };

        const result = compareValues(
          aValue,
          bValue,
          column?.sortType,
          sortConfig.direction,
        );
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
  ) => {
    setColumnFilters((prev) => {
      const newFilters = { ...prev };
      if (value) {
        newFilters[columnId] = { value, type };
      } else {
        delete newFilters[columnId];
      }
      return newFilters;
    });
    setCurrentPage(1);
  };

  const renderFilterInput = (column: ColumnDef<TData>) => {
    if (!column.enableColumnFilter) return null;

    const columnFilterValue =
      columnFilters[column.accessorKey as string]?.value;

    switch (column.filterType) {
      case 'number':
        return (
          <input
            type="number"
            placeholder="Filter..."
            value={String(columnFilterValue ?? '')}
            onChange={(e) =>
              handleColumnFilterChange(
                column.accessorKey as string,
                e.target.value,
                'number',
              )
            }
            className="w-full text-xs p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          />
        );
      case 'select': {
        const uniqueValues = Array.from(
          new Set(
            data.map((row) => String(row[column.accessorKey as keyof TData])),
          ),
        );
        return (
          <select
            value={String(columnFilterValue ?? '')}
            onChange={(e) =>
              handleColumnFilterChange(
                column.accessorKey as string,
                e.target.value,
                'select',
              )
            }
            className="w-full text-xs p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="">All</option>
            {uniqueValues.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        );
      }
      case 'dateRange':
        return (
          <input
            type="text"
            placeholder="Date Range..."
            value={String(columnFilterValue ?? '')}
            onChange={(e) =>
              handleColumnFilterChange(
                column.accessorKey as string,
                e.target.value,
                'dateRange',
              )
            }
            className="w-full text-xs p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          />
        );
      case 'text':
      default:
        return (
          <input
            type="text"
            placeholder="Filter..."
            value={String(columnFilterValue ?? '')}
            onChange={(e) =>
              handleColumnFilterChange(
                column.accessorKey as string,
                e.target.value,
                'text',
              )
            }
            className="w-full text-xs p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          />
        );
    }
  };

  const tableClasses = `min-w-full divide-y divide-gray-200 border border-gray-200 ${className}`;
  const rowClasses = (rowIndex: number, isSelected: boolean) =>
    `${stripedRows && rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'} ${
      isSelected ? 'bg-blue-100' : ''
    } hover:bg-gray-100 ${compact ? 'py-2' : 'py-4'} divide-y divide-gray-200`;
  const cellPadding = compact ? 'px-4 py-2' : 'px-6 py-4';

  const toggleRowExpansion = (rowId: string | number) => {
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
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10 rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <span className="sr-only">Loading...</span>
        </div>
      )}

      {enableFiltering && (
        <div className="mb-4 p-2 border border-gray-200 rounded-t-lg bg-white">
          <input
            type="text"
            placeholder="Search all columns..."
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Global filter search input"
          />
        </div>
      )}
      <table className={tableClasses} role="grid">
        <thead className="bg-gray-100">
          <tr role="row">
            {enableRowSelection && (
              <th
                scope="col"
                className={`w-12 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider ${cellPadding}`}
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
                className={`w-12 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider ${cellPadding}`}
              >
                {/* Empty header for expand/collapse column */}
              </th>
            )}
            {columns.map((column, index) => (
              <th
                key={column.accessorKey.toString() || index}
                scope="col"
                className={`text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${cellPadding} ${
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
                      column.sortable ? undefined : (e) => e.stopPropagation()
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
                              className="h-4 w-4 text-gray-700"
                              aria-hidden="true"
                            />
                          )}
                        {sortConfig?.key === column.accessorKey &&
                          sortConfig.direction === 'desc' && (
                            <ChevronDown
                              className="h-4 w-4 text-gray-700"
                              aria-hidden="true"
                            />
                          )}
                        {sortConfig?.key !== column.accessorKey && (
                          <ChevronUp
                            className="h-4 w-4 text-gray-300"
                            aria-hidden="true"
                          />
                        )}
                      </>
                    )}
                    {column.enableColumnFilter && (
                      <div
                        className="relative ml-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {renderFilterInput(column)}
                      </div>
                    )}
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {paginatedData.length === 0 && !isLoading ? (
            <tr>
              <td
                colSpan={
                  columns.length +
                  (enableRowSelection ? 1 : 0) +
                  (renderSubComponent ? 1 : 0)
                }
                className={`text-center ${cellPadding} text-gray-500`}
              >
                {emptyStateContent}
              </td>
            </tr>
          ) : (
            paginatedData.map((row, rowIndex) => {
              const rowId = rowIdAccessor ? rowIdAccessor(row) : undefined;
              const isSelected =
                rowId !== undefined ? selectedRowIds.has(rowId) : false;
              const isExpanded =
                rowId !== undefined ? expandedRowIds.has(rowId) : false;
              const totalColumns =
                columns.length +
                (enableRowSelection ? 1 : 0) +
                (renderSubComponent ? 1 : 0);

              return (
                <React.Fragment key={rowId !== undefined ? rowId : rowIndex}>
                  <tr className={rowClasses(rowIndex, isSelected)} role="row">
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
                          className={`whitespace-nowrap text-sm text-gray-800 ${cellPadding}`}
                          role="gridcell"
                        >
                          {column.cell
                            ? column.cell(
                                value,
                                row,
                                column as ColumnDef<TData>,
                              )
                            : String(value)}
                        </td>
                      );
                    })}
                  </tr>
                  {isExpanded && renderSubComponent && (
                    <tr id={`details-row-${rowId}`} role="row">
                      <td
                        colSpan={totalColumns}
                        className="p-4 bg-gray-50 border-t border-gray-200"
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

      {enablePagination && totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 px-4 py-2 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700" aria-live="polite">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
