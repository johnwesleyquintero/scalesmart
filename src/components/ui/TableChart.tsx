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
   * Receives the cell's value and the full row data.
   * @param value The raw value from the data object for this cell.
   * @param row The entire data object for the current row.
   * @returns A ReactNode to render in the cell.
   */
  cell?: (value: any, row: TData) => React.ReactNode;
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
}

/**
 * A versatile and reusable Table Chart component built with React and Tailwind CSS.
 * It supports dynamic data rendering, custom cell rendering, basic styling options,
 * client-side sorting, and pagination.
 *
 * @template TData The type of the data objects that will be displayed in the table.
 *                 Must extend `Record<string, any>` to allow flexible data access.
 *
 * @param {TableChartProps<TData>} props The props for the TableChart component.
 * @returns {JSX.Element} The rendered TableChart component.
 */
const TableChart = <TData extends Record<string, any>>(
  {
    data,
    columns,
    stripedRows = false,
    compact = false,
    className = '',
    enablePagination = false,
    initialPageSize = 10,
  }: TableChartProps<TData>
) => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof TData | string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialPageSize);

  const sortedData = useMemo(() => {
    let sortableItems = [...data];
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
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
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
  }, [data, sortConfig]);

  const paginatedData = useMemo(() => {
    if (!enablePagination) {
      return sortedData;
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, itemsPerPage, enablePagination]);

  const totalPages = enablePagination ? Math.ceil(sortedData.length / itemsPerPage) : 1;

  const requestSort = (key: keyof TData | string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
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
  const rowClasses = (rowIndex: number) =>
    `${stripedRows && rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'} ${
      compact ? 'py-2' : 'py-4'
    } divide-y divide-gray-200`;
  const cellPadding = compact ? 'px-4 py-2' : 'px-6 py-4';

  return (
    <div className="overflow-x-auto shadow-sm rounded-lg">
      <table className={tableClasses} role="grid">
        <thead className="bg-gray-100">
          <tr role="row">
            {columns.map((column, index) => (
              <th
                key={column.accessorKey.toString() || index}
                scope="col"
                className={`text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${cellPadding} ${
                  column.sortable ? 'cursor-pointer select-none' : ''
                }`}
                onClick={() => column.sortable && requestSort(column.accessorKey)}
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
                      {sortConfig?.key === column.accessorKey && sortConfig.direction === 'asc' && (
                        <ChevronUp className="h-4 w-4 text-gray-700" aria-hidden="true" />
                      )}
                      {sortConfig?.key === column.accessorKey && sortConfig.direction === 'desc' && (
                        <ChevronDown className="h-4 w-4 text-gray-700" aria-hidden="true" />
                      )}
                      {sortConfig?.key !== column.accessorKey && (
                        <ChevronUp className="h-4 w-4 text-gray-300" aria-hidden="true" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {paginatedData.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowClasses(rowIndex)} role="row">
              {columns.map((column, colIndex) => {
                const value = row[column.accessorKey as keyof TData];
                return (
                  <td
                    key={column.accessorKey.toString() + colIndex}
                    className={`whitespace-nowrap text-sm text-gray-800 ${cellPadding}`}
                    role="gridcell"
                  >
                    {column.cell ? column.cell(value, row) : String(value)}
                  </td>
                );
              })}
            </tr>
          ))}
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
