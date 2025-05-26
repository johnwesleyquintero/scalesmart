import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

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
}

/**
 * Props for the reusable TableChart component.
 * @template TData The type of the data objects in the table.
 */
export interface TableChartProps<TData> {
  /**
   * An array of data objects to display in the table.
   * Each object represents a row.
   */
  data: TData[];
  /**
   * An array of column definitions, specifying how each column should be rendered and behave.
   */
  columns: ColumnDef<TData>[];
  /**
   * If true, applies a striped background to alternate rows for better readability.
   * @default false
   */
  stripedRows?: boolean;
  /**
   * If true, reduces padding and font sizes for a more compact table layout.
   * @default false
   */
  compact?: boolean;
  /**
   * Optional CSS class names to apply to the main table container div.
   */
  className?: string;
  /**
   * If true, enables client-side pagination for the table.
   * @default false
   */
  enablePagination?: boolean;
  /**
   * The number of items to display per page when pagination is enabled.
   * @default 10
   */
  initialPageSize?: number;
  /**
   * If true, enables client-side global filtering for the table.
   * A search input will be displayed above the table.
   * @default false
   */
  enableFiltering?: boolean;
  /**
   * If true, enables row selection functionality with checkboxes.
   * @default false
   */
  enableRowSelection?: boolean;
  /**
   * A function to extract a unique ID for each row. Required if `enableRowSelection` is true.
   * @param row The data object for the current row.
   * @returns A unique identifier (string or number) for the row.
   */
  rowIdAccessor?: (row: TData) => string | number;
  /**
   * Callback function triggered when the row selection changes.
   * Provides an array of the currently selected data objects.
   * @param selectedRows An array of the selected data objects.
   */
  onRowSelectionChange?: (selectedRows: TData[]) => void;
  /**
   * An optional render function to display detailed content when a row is expanded.
   * If provided, an expand/collapse button will appear in each row.
   * @param row The data object for the current row being expanded.
   * @returns A ReactNode to render as the sub-component.
   */
  renderSubComponent?: (row: TData) => React.ReactNode;
  /**
   * If true, displays a loading indicator over the table.
   * @default false
   */
  isLoading?: boolean;
  /**
   * Optional content to display when the table has no data.
   * Can be a string or a ReactNode for custom rendering.
   * @default "No data available."
   */
  emptyStateContent?: React.ReactNode;
}

/**
 * A versatile and reusable Table Chart component built with React and Tailwind CSS.
 * It supports dynamic data rendering, custom cell rendering, basic styling options,
 * client-side sorting, pagination, global client-side filtering, row selection,
 * expandable rows with sub-components, a loading state indicator, and customizable empty state.
 *
 * @template TData The type of the data objects that will be displayed in the table.
 *                 Must extend `Record<string, unknown>` to allow flexible data access.
 *
 * @param {TableChartProps<TData>} props The props for the TableChart component.
 * @returns {JSX.Element} The rendered TableChart component.
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
  enableRowSelection = false,
  rowIdAccessor,
  onRowSelectionChange,
  renderSubComponent,
  isLoading = false,
  emptyStateContent = 'No data available.',
}: TableChartProps<TData>) => {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof TData | string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialPageSize);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string | number>>(
    new Set(),
  );
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string | number>>(
    new Set(),
  );

  // Effect to call onRowSelectionChange when selectedRowIds or data changes
  React.useEffect(() => {
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
  React.useEffect(() => {
    setExpandedRowIds(new Set());
  }, [data, globalFilter, sortConfig]);

  const filteredData = useMemo(() => {
    if (!enableFiltering || !globalFilter) {
      return data;
    }
    const filterLower = globalFilter.toLowerCase();
    return data.filter((row) =>
      columns.some((column) => {
        const value = row[column.accessorKey as keyof TData];
        // Handle potential null/undefined values gracefully
        return String(value ?? '')
          .toLowerCase()
          .includes(filterLower);
      }),
    );
  }, [data, columns, globalFilter, enableFiltering]);

  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData]; // Sort filtered data
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof TData];
        const bValue = b[sortConfig.key as keyof TData];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc'
            ? aValue - bValue
            : bValue - aValue;
        }
        // Fallback for other types or mixed types
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]); // Depend on filteredData

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
    setCurrentPage(1); // Reset to first page on sort
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
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
      className={`overflow-x-auto shadow-sm rounded-lg relative ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
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
              setCurrentPage(1); // Reset to first page on filter change
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
                <div className="flex items-center">
                  {column.header}
                  {column.sortable && (
                    <span className="ml-1">
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
                    </span>
                  )}
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
                            ? column.cell(value, row, column)
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
