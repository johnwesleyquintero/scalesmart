// src/components/amazon-seller-tools/overview/OverviewDataView.tsx
import React, { useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import TableChart, {
  ColumnDef,
} from '@/components/amazon-seller-tools/charts/TableChart';
import { cn } from '@/lib/utils';

import type {
  DashboardMetrics,
  TargetMetricConfig,
  MetricKey,
} from '@/lib/amazon-tools/types';
import {
  formatCurrencyValue,
  formatPercentageValue,
  formatDateValue,
  formatDefaultValue,
  getCellFormatter,
} from '@/lib/utils/formatting';
import { ComparisonKpiCard } from './ComparisonKpiCard';
import { SalesTrendsChart } from '../charts/SalesTrendsChart';
import { ClicksImpressionsChart } from '../charts/ClicksImpressionsChart';
import { OrdersSessionsChart } from '../charts/OrdersSessionsChart';
import { AdSpendSalesChart } from '../charts/AdSpendSalesChart';
import { ProfitTrendChart } from '../charts/ProfitTrendChart';
import KeywordVsAdSalesDonutChart from '../charts/KeywordVsAdSalesDonutChart';

interface OverviewDataViewProps {
  metrics: DashboardMetrics[];
  targetMetricsConfig: readonly TargetMetricConfig[];
  onDeleteMetric: (metricDate: string, metricIdentifier?: string) => void;
  aggregatedAndSortedMetrics: DashboardMetrics[];
  timeGranularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'; // Add timeGranularity prop
}

export const OverviewDataView: React.FC<OverviewDataViewProps> = ({
  metrics,
  targetMetricsConfig,
  onDeleteMetric,
  aggregatedAndSortedMetrics,
  timeGranularity, // Destructure timeGranularity
}) => {
  const tableColumns: ColumnDef<DashboardMetrics>[] = useMemo(() => {
    // Define which metrics to show in the table and their display properties
    const displayKeys: (keyof DashboardMetrics)[] = [
      'date',
      'unique_identifier',
      'keyword',
      'total_sales',
      'total_orders',
      'total_sessions',
      'total_conversion_rate',
      'ad_impressions',
      'ad_clicks',
      'ad_spend',
      'ad_sales',
      'acos',
      'roas',
      'profit',
    ];

    return displayKeys
      .map((key): ColumnDef<DashboardMetrics> | null => {
        const config = targetMetricsConfig.find((t) => t.key === key);
        if (!config) return null;

        // Get the specific formatter for this key
        const formatterForThisCell = getCellFormatter(key);

        return {
          accessorKey: key,
          header: config.label,
          sortable: true, // Enable sorting for all displayed columns
          cell: (
            value: unknown,
            _row: DashboardMetrics,
            _column: ColumnDef<DashboardMetrics>,
          ) => {
            // Handle undefined or null values directly in the cell function
            if (value == null) {
              return 'N/A';
            }
            return formatterForThisCell(value);
          },
        };
      })
      .filter(
        (column): column is ColumnDef<DashboardMetrics> => column !== null,
      );
  }, [targetMetricsConfig]);

  // Memoize rowIdAccessor for Detailed Metrics TableChart
  const detailedMetricsRowIdAccessor = useCallback(
    (row: DashboardMetrics) => `${row.date}-${row.unique_identifier}`,
    [],
  );

  const averageConversionRate = useMemo(() => {
    if (
      aggregatedAndSortedMetrics.length > 0 &&
      aggregatedAndSortedMetrics.every(
        (m) => typeof m.total_conversion_rate === 'number',
      )
    ) {
      return (
        aggregatedAndSortedMetrics.reduce(
          (sum, m) => sum + (m.total_conversion_rate || 0),
          0,
        ) / aggregatedAndSortedMetrics.length
      );
    }
    return 0;
  }, [aggregatedAndSortedMetrics]);

  const totalSales = useMemo(() => {
    return aggregatedAndSortedMetrics.reduce(
      (sum, m) => sum + (m.total_sales || 0),
      0,
    );
  }, [aggregatedAndSortedMetrics]);

  const averageClicks = useMemo(() => {
    if (aggregatedAndSortedMetrics.length > 0) {
      return (
        aggregatedAndSortedMetrics.reduce(
          (sum, m) => sum + (m.ad_clicks || 0),
          0,
        ) / aggregatedAndSortedMetrics.length
      );
    }
    return 0;
  }, [aggregatedAndSortedMetrics]);

  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="text-lg font-semibold mb-2">
                      Avg. Conversion Rate
                    </h4>
                    <div className="text-3xl font-bold text-blue-600">
                      {averageConversionRate.toFixed(2)}%
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Avg. (Orders/Sessions) from Report
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Average Conversion Rate: Calculated as (Total Orders / Total
                Sessions) * 100.
              </p>
              <p>
                This represents the percentage of website visits that resulted
                in a purchase.
              </p>
              <p>
                A higher percentage indicates better website performance and
                customer engagement.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="text-lg font-semibold mb-2">Total Sales</h4>
                    <div className="text-3xl font-bold text-success">
                      $
                      {totalSales.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Sum from Report Period
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Total Sales: The sum of all sales recorded during the selected
                period.
              </p>
              <p>This represents your total revenue generated from sales.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="text-lg font-semibold mb-2">Avg. Clicks</h4>
                    <div className="text-3xl font-bold text-yellow-600">
                      {averageClicks.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Average from Report
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Average Clicks: The average number of clicks on your
                advertisements during the selected period.
              </p>
              <p>
                This metric reflects the effectiveness of your ad campaigns in
                attracting customer attention.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <SalesTrendsChart
          sortedMetrics={aggregatedAndSortedMetrics}
          granularity={timeGranularity}
        />
        <ClicksImpressionsChart
          sortedMetrics={aggregatedAndSortedMetrics}
          granularity={timeGranularity}
        />
        <OrdersSessionsChart
          sortedMetrics={aggregatedAndSortedMetrics}
          granularity={timeGranularity}
        />
        <AdSpendSalesChart
          sortedMetrics={aggregatedAndSortedMetrics}
          granularity={timeGranularity}
        />
        <ProfitTrendChart
          sortedMetrics={aggregatedAndSortedMetrics}
          granularity={timeGranularity}
        />
        <KeywordVsAdSalesDonutChart
          sortedMetrics={aggregatedAndSortedMetrics}
          title="Keyword vs. Ad Sales"
        />
      </div>

      {/* Data Table */}
      <div className="mb-6">
        <h4 className="text-xl font-semibold mb-3">Detailed Metrics Table</h4>
        <TableChart
          data={aggregatedAndSortedMetrics}
          columns={tableColumns}
          stripedRows
          enablePagination
          initialPageSize={10}
          rowIdAccessor={detailedMetricsRowIdAccessor}
        />
      </div>
    </>
  );
};
