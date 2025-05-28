'use client';

import React, { useState, useMemo } from 'react';
import type { DashboardMetrics } from '@/lib/amazon-tools/types';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface KeywordPerformanceTableProps {
  metrics: DashboardMetrics[];
  isLoading?: boolean;
}

type SortableKey =
  | 'date'
  | 'unique_identifier'
  | 'targeted_keyword'
  | 'keyword_ad_impressions'
  | 'keyword_ad_clicks'
  | 'keyword_ad_spend'
  | 'keyword_ad_sales_7_day'
  | 'keyword_ad_orders_7_day'
  | 'keyword_ctr'
  | 'keyword_cpc'
  | 'keyword_cvr'
  | 'keyword_acos';

interface SortConfig {
  key: SortableKey | null;
  direction: 'ascending' | 'descending';
}

export const KeywordPerformanceTable: React.FC<
  KeywordPerformanceTableProps
> = ({ metrics, isLoading = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [asinFilter, setAsinFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'date',
    direction: 'descending',
  });

  console.log(
    'KeywordPerformanceTable: Raw metrics unique_identifiers:',
    metrics.map((m) => m.unique_identifier),
  );

  const processedMetrics = useMemo(() => {
    return metrics
      .filter(
        (metric) =>
          metric.targeted_keyword &&
          metric.unique_identifier && // Ensure ASIN is also present
          (searchTerm === '' ||
            metric.targeted_keyword
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase())) &&
          (asinFilter === '' ||
            metric.unique_identifier
              ?.toLowerCase()
              .includes(asinFilter.toLowerCase())),
      )
      .map((metric) => {
        const impressions = metric.keyword_ad_impressions || 0;
        const clicks = metric.keyword_ad_clicks || 0;
        const spend = metric.keyword_ad_spend || 0;
        const sales = metric.keyword_ad_sales_7_day || 0;
        const orders = metric.keyword_ad_orders_7_day || 0;

        return {
          ...metric,
          keyword_ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
          keyword_cpc: clicks > 0 ? spend / clicks : 0,
          keyword_cvr: clicks > 0 ? (orders / clicks) * 100 : 0,
          keyword_acos: sales > 0 ? (spend / sales) * 100 : 0,
        };
      });
  }, [metrics, searchTerm, asinFilter]);

  console.log(
    'KeywordPerformanceTable: Processed metrics unique_identifiers (after useMemo):',
    processedMetrics.map((m) => m.unique_identifier),
  );
  const sortedMetrics = useMemo(() => {
    let sortableItems = [...processedMetrics];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key!];
        const valB = b[sortConfig.key!];

        if (valA === undefined || valA === null) return 1; // push undefined/null to the end
        if (valB === undefined || valB === null) return -1;

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortConfig.direction === 'ascending'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortConfig.direction === 'ascending'
            ? valA - valB
            : valB - valA;
        }
        // Fallback for date strings or other types
        const strA = String(valA);
        const strB = String(valB);
        return sortConfig.direction === 'ascending'
          ? strA.localeCompare(strB)
          : strB.localeCompare(strA);
      });
    }
    return sortableItems;
  }, [processedMetrics, sortConfig]);

  const requestSort = (key: SortableKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (key: SortableKey) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    return sortConfig.direction === 'ascending' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  const tableHeaders: {
    key: SortableKey;
    label: string;
    isNumeric?: boolean;
  }[] = [
    { key: 'date', label: 'Date' },
    { key: 'unique_identifier', label: 'ASIN' },
    { key: 'targeted_keyword', label: 'Keyword' },
    { key: 'keyword_ad_impressions', label: 'Impressions', isNumeric: true },
    { key: 'keyword_ad_clicks', label: 'Clicks', isNumeric: true },
    { key: 'keyword_ad_spend', label: 'Spend', isNumeric: true },
    { key: 'keyword_ad_sales_7_day', label: 'Sales', isNumeric: true },
    { key: 'keyword_ad_orders_7_day', label: 'Orders', isNumeric: true },
    { key: 'keyword_ctr', label: 'CTR', isNumeric: true },
    { key: 'keyword_cpc', label: 'CPC', isNumeric: true },
    { key: 'keyword_cvr', label: 'CVR', isNumeric: true },
    { key: 'keyword_acos', label: 'ACoS', isNumeric: true },
  ];

  if (isLoading) {
    return (
      <div className="p-4 text-center">Loading keyword performance data...</div>
    );
  }

  if (!metrics || metrics.length === 0) {
    return (
      <div className="p-4 text-center">
        No data available to display. Please upload or process your CSV.
      </div>
    );
  }

  if (sortedMetrics.length === 0 && (searchTerm || asinFilter)) {
    return (
      <div className="p-4">
        <div className="flex space-x-4 mb-4">
          <Input
            placeholder="Filter by ASIN..."
            value={asinFilter}
            onChange={(e) => setAsinFilter(e.target.value)}
            className="max-w-xs"
          />
          <Input
            placeholder="Filter by Keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <div className="p-4 text-center text-muted-foreground">
          No matching keyword data found for your filters.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 looker-studio-table-container">
      <h3 className="text-xl font-semibold mb-4">
        Keyword Performance Analysis
      </h3>
      <div className="flex space-x-4 mb-4">
        <Input
          placeholder="Filter by ASIN (e.g., B00EXAMPLE)..."
          value={asinFilter}
          onChange={(e) => setAsinFilter(e.target.value)}
          className="max-w-xs"
        />
        <Input
          placeholder="Filter by Keyword (e.g., eco water bottle)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {tableHeaders.map((header) => (
                <TableHead
                  key={header.key}
                  onClick={() => requestSort(header.key)}
                  className={`cursor-pointer hover:bg-muted/50 ${header.isNumeric ? 'text-right' : ''}`}
                >
                  <div className="flex items-center">
                    {header.label}
                    {renderSortIcon(header.key)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedMetrics.map((metric, index) => (
              <TableRow
                key={`${metric.date}-${metric.unique_identifier}-${metric.targeted_keyword}-${index}`}
              >
                {' '}
                <TableCell>{metric.date}</TableCell>
                <TableCell>{metric.unique_identifier}</TableCell>
                <TableCell>{metric.targeted_keyword}</TableCell>
                <TableCell className="text-right">
                  {metric.keyword_ad_impressions?.toLocaleString() ?? 'N/A'}
                </TableCell>
                <TableCell className="text-right">
                  {metric.keyword_ad_clicks?.toLocaleString() ?? 'N/A'}
                </TableCell>
                <TableCell className="text-right">
                  {metric.keyword_ctr?.toFixed(2) ?? 'N/A'}%
                </TableCell>
                <TableCell className="text-right">
                  ${metric.keyword_cpc?.toFixed(2) ?? 'N/A'}
                </TableCell>
                <TableCell className="text-right">
                  ${metric.keyword_ad_spend?.toFixed(2) ?? 'N/A'}
                </TableCell>
                <TableCell className="text-right">
                  {metric.keyword_ad_orders_7_day?.toLocaleString() ?? 'N/A'}
                </TableCell>
                <TableCell className="text-right">
                  ${metric.keyword_ad_sales_7_day?.toFixed(2) ?? 'N/A'}
                </TableCell>
                <TableCell className="text-right">
                  {metric.keyword_cvr?.toFixed(2) ?? 'N/A'}%
                </TableCell>
                <TableCell className="text-right">
                  {metric.keyword_acos?.toFixed(2) ?? 'N/A'}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {sortedMetrics.length === 0 && !searchTerm && !asinFilter && (
        <div className="p-4 text-center text-muted-foreground">
          No keyword-specific data found in the uploaded file. Ensure your CSV
          includes keyword columns.
        </div>
      )}
    </div>
  );
};
