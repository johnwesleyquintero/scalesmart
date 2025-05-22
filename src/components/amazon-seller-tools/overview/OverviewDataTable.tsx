'use client';

import React, { useState, useMemo } from 'react';
import type { DashboardMetrics, TargetMetricConfig } from '@/app/amazon-seller-tools/page';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OverviewDataTableProps {
  metrics: DashboardMetrics[];
  targetMetricsConfig: TargetMetricConfig[];
  isLoading?: boolean;
}

interface SortConfig {
  key: keyof DashboardMetrics | null;
  direction: 'ascending' | 'descending';
}

const ITEMS_PER_PAGE = 10;

export const OverviewDataTable: React.FC<OverviewDataTableProps> = ({
  metrics,
  targetMetricsConfig,
  isLoading = false,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'descending' });

  const sortedMetrics = useMemo(() => {
    let sortableItems = [...metrics];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key!];
        const valB = b[sortConfig.key!];

        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortConfig.direction === 'ascending' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortConfig.direction === 'ascending' ? valA - valB : valB - valA;
        }
        const strA = String(valA);
        const strB = String(valB);
        return sortConfig.direction === 'ascending' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }
    return sortableItems;
  }, [metrics, sortConfig]);

  const paginatedMetrics = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedMetrics.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedMetrics, currentPage]);

  const totalPages = Math.ceil(sortedMetrics.length / ITEMS_PER_PAGE);

  const requestSort = (key: keyof DashboardMetrics) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page on sort
  };

  const renderSortIcon = (key: keyof DashboardMetrics) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const formatNumberCell = (value: number, currentCellKey: keyof DashboardMetrics): string => {
    const currencyKeys: (keyof DashboardMetrics)[] = [
 'ordered_product_sales', 'ad_spend', 'ad_sales_7_day', 'profit',
 'customer_acquisition_cost', 'keyword_ad_spend', 'keyword_ad_sales_7_day',
 'lifetime_value_estimate', 'keyword_cpc'
 ];
    const directPercentageKeys: (keyof DashboardMetrics)[] = [
 'acos', 'ctr', 'keyword_ctr', 'keyword_cvr', 'keyword_acos',
 ];
    const wholeNumberKeys: (keyof DashboardMetrics)[] = [
 'sessions_total', 'page_views_total', 'ad_impressions', 'ad_clicks',
 'total_order_items', 'ad_orders_7_day', 'keyword_ad_impressions',
 'keyword_ad_clicks', 'keyword_ad_orders_7_day', 'current_inventory'
 ];

    if (currencyKeys.includes(currentCellKey)) {
 return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (directPercentageKeys.includes(currentCellKey)) {
 return `${value.toFixed(2)}%`;
    }
    if (currentCellKey === 'roas') {
 return value.toFixed(2);
    }
    if (currentCellKey === 'average_review_score') {
 return value.toFixed(1);
    }
    if (wholeNumberKeys.includes(currentCellKey)) {
 return value.toLocaleString();
    }
 return value.toLocaleString();
  };

  const formatCell = (value: unknown, config: TargetMetricConfig): string => {
    if (value === null || value === undefined) return 'N/A';
    const { expectedType, key: currentCellKey } = config;

    if (expectedType === 'number') {
      if (typeof value === 'number') {
 return formatNumberCell(value, currentCellKey);
      }
      // If expectedType is 'number' but value isn't, just stringify.
      // Ideally, data transformation ensures numbers are numbers by this point.
      return String(value);
    }
    if (expectedType === 'date' && (typeof value === 'string' || value instanceof Date)) {
      const date = value instanceof Date ? value : new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
    }
    return String(value);
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading detailed metrics data...</div>;
  }

  if (metrics.length === 0) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Detailed Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center text-muted-foreground">No data loaded to display in the table.</div>
        </CardContent>
      </Card>
    );
  }

  // Diagnostic check for targetMetricsConfig
  if (!targetMetricsConfig || targetMetricsConfig.length === 0) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Detailed Metrics Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center text-destructive">Error: Table column configuration (targetMetricsConfig) is missing or empty. Please check OverviewTab.tsx.</div>
        </CardContent>
      </Card>
    );
  }

  // Console logs for deeper inspection
  console.log("OverviewDataTable rendering. targetMetricsConfig:", JSON.stringify(targetMetricsConfig, null, 2));
  if (paginatedMetrics.length > 0) {
    console.log("First paginated metric:", JSON.stringify(paginatedMetrics[0], null, 2));
  }
  console.log("Paginated metrics length:", paginatedMetrics.length);
  console.log("Total pages:", totalPages);

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Detailed Metrics Data</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {targetMetricsConfig.map((config, idx) => {
                  // console.log(`Rendering header ${idx}: Label='${config.label}', Key='${String(config.key)}'`);
                  return (
                    <TableHead
                      key={String(config.key) || `header-${idx}`}
                      onClick={() => requestSort(config.key)}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <div className="flex items-center">
                        {config.label || `[Header ${idx + 1}]`} {/* Fallback for missing label */}
                        {renderSortIcon(config.key)}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMetrics.map((metric, rowIndex) => (
                <TableRow key={`${metric.date}-${metric.unique_identifier || rowIndex}`}>
                  {targetMetricsConfig.map((config, colIndex) => {
                    const cellValue = metric[config.key];
                    const formattedCell = formatCell(cellValue, config);
                    // console.log(`Cell[${rowIndex},${colIndex}] Key='${String(config.key)}', Value='${cellValue}', Formatted='${formattedCell}'`);
                    return (
                      <TableCell key={`${String(config.key)}-${colIndex}-${rowIndex}`}>
                        {formattedCell || (cellValue === undefined || cellValue === null ? 'N/A' : `[Empty Cell: ${String(config.key)}]`)} {/* Fallback for empty formatted cell */}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
              {paginatedMetrics.length === 0 && metrics.length > 0 && (
                <TableRow>
                  <TableCell colSpan={targetMetricsConfig.length || 1} className="text-center text-muted-foreground">
                    No data to display for the current page.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
