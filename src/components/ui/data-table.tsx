'use client';

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowDownUp, Columns } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Props for the DataTable component.
 */
interface DataTableProps<TData, TValue> {
  /** The column definitions for the table. */
  columns: ColumnDef<TData, TValue>[];
  /** The data to display in the table. */
  data: TData[];
  /** Indicates if the data is currently loading. */
  loading?: boolean;
}

/**
 * A generic data table component with filtering, sorting, and pagination.
 * Built using TanStack Table.
 * @see https://tanstack.com/table/v8
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
}: Readonly<DataTableProps<TData, TValue>>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <Input
          placeholder="Filter all columns..."
          value={(table.getState().globalFilter as string) ?? ''}
          onChange={(event) =>
            table.setGlobalFilter((event.target as HTMLInputElement).value)
          }
          className="max-w-sm"
        />
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Columns className="mr-2 h-4 w-4" /> Columns
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter(
                  (column) => column.getCanHide(),
                  // && column.id !== 'actions'
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => {
                        column.toggleVisibility(value);
                      }}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? undefined
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                      {header.column.getCanSort() ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-2 h-6 w-6"
                          onClick={() => header.column.toggleSorting()}
                          aria-label={`Sort ${header.column.id} ${
                            header.column.getIsSorted() === 'asc'
                              ? 'descending'
                              : header.column.getIsSorted() === 'desc'
                                ? 'ascending'
                                : 'ascending'
                          }`}
                        >
                          <ArrowDownUp
                            className={`h-4 w-4 transition-transform ${
                              header.column.getIsSorted() === 'asc'
                                ? 'rotate-180'
                                : header.column.getIsSorted() === 'desc'
                                  ? 'rotate-0'
                                  : 'opacity-50'
                            }`}
                          />
                        </Button>
                      ) : undefined}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            table.previousPage();
          }}
          disabled={!table.getCanPreviousPage()}
          aria-label="Previous page"
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            table.nextPage();
          }}
          disabled={!table.getCanNextPage()}
          aria-label="Next page"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
