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
  const [dateFilter, setDateFilter] = useState('');
  const [totalSalesFilter, setTotalSalesFilter] = useState('');
  const [totalOrdersFilter, setTotalOrdersFilter] = useState('');
  const [totalSessionsFilter, setTotalSessionsFilter] = useState('');
  const [totalConversionRateFilter, setTotalConversionRateFilter] =
    useState('');
  const [adSpendFilter, setAdSpendFilter] = useState('');
  const [adSalesFilter, setAdSalesFilter] = useState('');
  const [acosFilter, setAcosFilter] = useState('');
  const [roasFilter, setRoasFilter] = useState('');
  const [profitFilter, setProfitFilter] = useState('');
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
    const filters = {
      date: dateFilter,
      total_sales: totalSalesFilter,
      total_orders: totalOrdersFilter,
      total_sessions: totalSessionsFilter,
      total_conversion_rate: totalConversionRateFilter,
      ad_spend: adSpendFilter,
      ad_sales: adSalesFilter,
      acos: acosFilter,
      roas: roasFilter,
      profit: profitFilter,
    };

    const applyColumnFilters = (item: DashboardMetrics) => {
      for (const key in filters) {
        if (
          filters[key as keyof typeof filters] &&
          !String(item[key as keyof DashboardMetrics])
            .toLowerCase()
            .includes(filters[key as keyof typeof filters].toLowerCase())
        ) {
          return false;
        }
      }
      return true;
    };

    let filtered = data;

    // Apply column filters
    filtered = filtered.filter(applyColumnFilters);

    // Apply global filter
    if (filter) {
      const lowerFilter = filter.toLowerCase();
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
  }, [
    data,
    filter,
    sortKey,
    sortOrder,
    dateFilter,
    totalSalesFilter,
    totalOrdersFilter,
    totalSessionsFilter,
    totalConversionRateFilter,
    adSpendFilter,
    adSalesFilter,
    acosFilter,
    roasFilter,
    profitFilter,
  ]);

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
                <div>
                  <Button
                    variant="ghost"
                    onClick={() => col.sortable && handleSort(col.key)}
                    disabled={!col.sortable}
                  >
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <ArrowUpDown
                        className={`ml-2 h-4 w-4 ${
                          sortOrder === 'asc'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                        h-5
                        w-5
                      />
                    )}
                  </Button>
                  {col.filterable && col.key === 'date' && (
                    <Input
                      placeholder={`Filter ${col.label}`}
                      className="max-w-[100px] mt-1"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                    />
                  )}
                  {col.filterable && col.key === 'total_sales' && (
                    <Input
                      placeholder={`Filter ${col.label}`}
                      className="max-w-[100px] mt-1"
                      value={totalSalesFilter}
                      onChange={(e) => setTotalSalesFilter(e.target.value)}
                    />
                  )}
                  {col.filterable && col.key === 'total_orders' && (
                    <Input
                      placeholder={`Filter ${col.label}`}
                      className="max-w-[100px] mt-1"
                      value={totalOrdersFilter}
                      onChange={(e) => setTotalOrdersFilter(e.target.value)}
                    />
                  )}
                  {col.filterable && col.key === 'total_sessions' && (
                    <Input
                      placeholder={`Filter ${col.label}`}
                      className="max-w-[100px] mt-1"
                      value={totalSessionsFilter}
                      onChange={(e) => setTotalSessionsFilter(e.target.value)}
                    />
                  )}
                  {col.filterable && col.key === 'total_conversion_rate' && (
                    <Input
                      placeholder={`Filter ${col.label}`}
                      className="max-w-[100px] mt-1"
                      value={totalConversionRateFilter}
                      onChange={(e) =>
                        setTotalConversionRateFilter(e.target.value)
                      }
                    />
                  )}
                  {col.filterable && col.key === 'ad_spend' && (
                    <Input
                      placeholder={`Filter ${col.label}`}
                      className="max-w-[100px] mt-1"
                      value={adSpendFilter}
                      onChange={(e) => setAdSpendFilter(e.target.value)}
                    />
                  )}
                  {col.filterable && col.key === 'ad_sales' && (
                    <Input
                      placeholder={`Filter ${col.label}`}
                      className="max-w-[100px] mt-1"
                      value={adSalesFilter}
                      onChange={(e) => setAdSalesFilter(e.target.value)}
                    />
                  )}
                  {col.filterable && col.key === 'acos' && (
                    <Input
                      placeholder={`Filter ${col.label}`}
                      className="max-w-[100px] mt-1"
                      value={acosFilter}
                      onChange={(e) => setAcosFilter(e.target.value)}
                    />
                  )}
                  {col.filterable && col.key === 'roas' && (
                    <Input
                      placeholder={`Filter ${col.label}`}
                      className="max-w-[100px] mt-1"
                      value={roasFilter}
                      onChange={(e) => setRoasFilter(e.target.value)}
                    />
                  )}
                  {col.filterable && col.key === 'profit' && (
                    <Input
                      placeholder={`Filter ${col.label}`}
                      className="max-w-[100px] mt-1"
                      value={profitFilter}
                      onChange={(e) => setProfitFilter(e.target.value)}
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
