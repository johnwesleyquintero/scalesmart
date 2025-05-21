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
  const [filter, setFilter] = useState('');
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

  const filteredAndSortedData = useMemo(() => {
    let filtered = data;
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      filtered = data.filter((item) =>
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
  }, [data, filter, sortKey, sortOrder]);

  const columns: {
    key: keyof DashboardMetrics;
    label: string;
    sortable?: boolean;
  }[] = [
    {
      key: 'date',
      label: `Date (${granularity.charAt(0).toUpperCase() + granularity.slice(1)})`,
      sortable: true,
    },
    { key: 'total_sales', label: 'Total Sales ($)', sortable: true },
    { key: 'total_orders', label: 'Total Orders', sortable: true },
    { key: 'total_sessions', label: 'Total Sessions', sortable: true },
    { key: 'total_conversion_rate', label: 'Conv. Rate (%)', sortable: true },
    { key: 'ad_spend', label: 'Ad Spend ($)', sortable: true },
    { key: 'ad_sales', label: 'Ad Sales ($)', sortable: true },
    { key: 'acos', label: 'ACoS (%)', sortable: true },
    { key: 'roas', label: 'RoAS', sortable: true },
    { key: 'profit', label: 'Profit ($)', sortable: true },
  ];

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filter data..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="max-w-sm"
      />
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key}>
                <Button
                  variant="ghost"
                  onClick={() => col.sortable && handleSort(col.key)}
                  disabled={!col.sortable}
                >
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  )}
                </Button>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedData.map((item, index) => (
            <TableRow key={item.date + '-' + index}>
              {' '}
              {/* Ensure unique key */}
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
          No data matches your filter.
        </p>
      )}
    </div>
  );
};
