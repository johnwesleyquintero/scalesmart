// src/components/amazon-seller-tools/overview/MetricsDataTable.tsx
import React, { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import type { DashboardMetrics } from '@/app/amazon-seller-tools/page'; // Adjust path if types are moved

interface MetricsDataTableProps {
  data: DashboardMetrics[];
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

type SortKey = keyof DashboardMetrics | null;

export const MetricsDataTable: React.FC<MetricsDataTableProps> = ({
  data,
  granularity,
}) => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<
    Partial<Record<keyof DashboardMetrics, string>>
  >({});
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const handleColumnFilterChange = (
    key: keyof DashboardMetrics,
    value: string,
  ) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearAllFilters = () => {
    setGlobalFilter('');
    setColumnFilters({});
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    // Apply column filters
    filtered = filtered.filter((item) => {
      for (const key in columnFilters) {
        const filterValue = columnFilters[key as keyof DashboardMetrics];
        if (
          filterValue &&
          !String(item[key as keyof DashboardMetrics])
            .toLowerCase()
            .includes(filterValue.toLowerCase())
        ) {
          return false;
        }
      }
      return true;
    });

    // Apply global filter
    if (globalFilter) {
      const lowerFilter = globalFilter.toLowerCase();
      filtered = filtered.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(lowerFilter),
        ),
      );
    }

    if (sortKey) {
      return [...filtered].sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];

        if (valA === undefined || valA === null)
          return sortOrder === 'asc' ? 1 : -1;
        if (valB === undefined || valB === null)
          return sortOrder === 'asc' ? -1 : 1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }
        if (sortKey === 'date') {
          return sortOrder === 'asc'
            ? new Date(valA as string).getTime() -
                new Date(valB as string).getTime()
            : new Date(valB as string).getTime() -
                new Date(valA as string).getTime();
        }
        return (
          String(valA).localeCompare(String(valB)) *
          (sortOrder === 'asc' ? 1 : -1)
        );
      });
    }
    return filtered;
  }, [data, globalFilter, columnFilters, sortKey, sortOrder]);

  const columns: {
    key: keyof DashboardMetrics;
    label: string;
    sortable?: boolean;
    filterable?: boolean;
  }[] = [
    {
      key: 'date',
      label: `Date (${granularity.charAt(0).toUpperCase() + granularity.slice(1)})`,
      sortable: true,
      filterable: true,
    },
    {
      key: 'total_sales',
      label: 'Total Sales ($)',
      sortable: true,
      filterable: true,
    },
    {
      key: 'total_orders',
      label: 'Total Orders',
      sortable: true,
      filterable: true,
    },
    {
      key: 'total_sessions',
      label: 'Total Sessions',
      sortable: true,
      filterable: true,
    },
    {
      key: 'total_conversion_rate',
      label: 'Conv. Rate (%)',
      sortable: true,
      filterable: true,
    },
    {
      key: 'ad_spend',
      label: 'Ad Spend ($)',
      sortable: true,
      filterable: true,
    },
    {
      key: 'ad_sales',
      label: 'Ad Sales ($)',
      sortable: true,
      filterable: true,
    },
    { key: 'acos', label: 'ACoS (%)', sortable: true, filterable: true },
    { key: 'roas', label: 'RoAS', sortable: true, filterable: true },
    { key: 'profit', label: 'Profit ($)', sortable: true, filterable: true },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Global filter..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <Button
          variant="outline"
          onClick={handleClearAllFilters}
          disabled={
            globalFilter === '' && Object.keys(columnFilters).length === 0
          }
        >
          Clear All Filters
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key}>
                <div className="flex flex-col">
                  <Button
                    variant="ghost"
                    onClick={() => col.sortable && handleSort(col.key)}
                    disabled={!col.sortable}
                    className="justify-start px-0"
                  >
                    {col.label}
                    {col.sortable && (
                      <ArrowUpDown
                        className={`ml-2 h-5 w-5 ${
                          sortKey === col.key
                            ? sortOrder === 'asc'
                              ? 'text-green-600'
                              : 'text-red-600'
                            : 'text-gray-400'
                        }`}
                      />
                    )}
                  </Button>
                  {col.filterable && (
                    <Input
                      placeholder={`Filter ${col.label.split(' ')[0]}...`}
                      className="max-w-[120px] mt-1 text-xs"
                      value={columnFilters[col.key] || ''}
                      onChange={(e) =>
                        handleColumnFilterChange(col.key, e.target.value)
                      }
                    />
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedData.map((item, index) => (
            <TableRow key={item.date + '-' + index}>
              {columns.map((col) => (
                <TableCell key={col.key}>
                  {typeof item[col.key] === 'number'
                    ? (item[col.key] as number).toLocaleString(undefined, {
                        minimumFractionDigits:
                          col.key === 'roas'
                            ? 2
                            : col.label.includes('%')
                              ? 1
                              : 2,
                        maximumFractionDigits: 2,
                      })
                    : String(item[col.key] ?? 'N/A')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {filteredAndSortedData.length === 0 && (
        <p className="text-center text-muted-foreground py-4">
          No data matches your current filters. Please adjust your filters or
          upload data.
        </p>
      )}
    </div>
  );
};
