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
  useReactTable,
  getFacetedRowModel,
  getFacetedUniqueValues,
} from '@tanstack/react-table';
import { ArrowDownUp, Columns } from 'lucide-react';
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function PpcTable<TData, TValue>({
  columns,
  data,
}: Readonly<DataTableProps<TData, TValue>>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <Input
          placeholder="Filter campaigns..."
          aria-label="Filter campaigns"
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            table
              .getColumn('name')
              ?.setFilterValue((event.target as HTMLInputElement).value)
          }
          className="max-w-sm"
        />
        {/* Add a filter for 'status' column if it exists */}
        {table.getColumn('status') && (
          <Select
            value={
              (table.getColumn('status')?.getFilterValue() as string) ?? ''
            }
            onValueChange={(value) =>
              table.getColumn('status')?.setFilterValue(value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              {Array.from(
                table.getColumn('status')?.getFacetedUniqueValues().keys() ||
                  [],
              ).map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger aria-haspopup="true">
              <Columns className="mr-2 h-4 w-4" /> Columns
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => {
                        column.toggleVisibility(!!value);
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
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                      {header.column.getCanSort() ? (
                        <button
                          className="ml-2"
                          tabIndex={0}
                          aria-label={`Sort by ${header.column.id} ${header.column.getSortIndex() === 0 ? 'ascending' : 'descending'}`}
                          onClick={() => {
                            table.setSorting(
                              header.column.getSortIndex() === 0
                                ? [
                                    {
                                      id: header.column.id,
                                      desc: false,
                                    },
                                  ]
                                : [],
                            );
                          }}
                        >
                          <ArrowDownUp className="h-4 w-4" />
                        </button>
                      ) : null}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-2">
        <button
          onClick={() => {
            table.previousPage();
          }}
          disabled={!table.getCanPreviousPage()}
          aria-label="Previous page"
          tabIndex={0}
        >
          Previous
        </button>
        <button
          onClick={() => {
            table.nextPage();
          }}
          disabled={!table.getCanNextPage()}
          aria-label="Next page"
          tabIndex={0}
        >
          Next
        </button>
      </div>
    </div>
  );
}
