// src/components/amazon-seller-tools/overview/OverviewDataView.tsx
import React, { useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import TableChart, {
  ColumnDef,
} from '@/components/amazon-seller-tools/charts/TableChart';
import type {
  DashboardMetrics,
  TargetMetricConfig,
} from '@/app/amazon-seller-tools/page';
import { ComparisonKpiCard } from './ComparisonKpiCard';
import { SalesTrendsChart } from '../charts/SalesTrendsChart';
import { ClicksImpressionsChart } from '../charts/ClicksImpressionsChart';
import { OrdersSessionsChart } from '../charts/OrdersSessionsChart'; // Corrected import path
import { AdSpendSalesChart } from '../charts/AdSpendSalesChart';
import { ProfitTrendChart } from '../charts/ProfitTrendChart';
import KeywordVsAdSalesDonutChart from '../charts/KeywordVsAdSalesDonutChart';

interface OverviewDataViewProps {
  metrics: DashboardMetrics[];
  targetMetricsConfig: TargetMetricConfig[];
  onDeleteMetric: (metricDate: string, metricIdentifier?: string) => void;
  timeGranularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  setTimeGranularity: (
    granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
  ) => void;
  aggregatedAndSortedMetrics: DashboardMetrics[];
}

// --- Helper Formatting Functions (can be moved to a utils file if preferred) ---
const formatCurrencyValue = (value: unknown): React.ReactNode => {
  if (typeof value === 'number') {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return 'N/A';
};

const formatPercentageValue = (value: unknown): React.ReactNode => {
  if (typeof value === 'number') {
    return `${value.toFixed(2)}%`;
  }
  return 'N/A';
};

const formatDateValue = (value: unknown): React.ReactNode => {
  if (typeof value === 'string') {
    try {
      const date = new Date(value);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return value; // Return original string if date is invalid
      }
      return date.toLocaleDateString();
    } catch {
      return value; // Return original string on error
    }
  }
  // Fallback for non-string date values, or return 'N/A'
  return value != null ? String(value) : 'N/A';
};

const formatDefaultValue = (value: unknown): React.ReactNode => {
  return value != null ? String(value) : 'N/A'; // Handles undefined and null
};

// Function to get the appropriate formatter based on the metric key
const getCellFormatter = (
  metricKey: keyof DashboardMetrics,
): ((val: unknown) => React.ReactNode) => {
  switch (metricKey) {
    case 'total_sales':
    case 'ad_spend':
    case 'ad_sales':
    case 'profit':
      return formatCurrencyValue;
    case 'total_conversion_rate':
    case 'acos':
    case 'roas':
      return formatPercentageValue;
    case 'date': // Handles the primary date key
      return formatDateValue;
    default:
      // For other keys that might be dates by convention (e.g., 'creation_date')
      if (typeof metricKey === 'string' && metricKey.includes('date')) {
        return formatDateValue;
      }
      return formatDefaultValue;
  }
};
// --- End Helper Formatting Functions ---

export const OverviewDataView: React.FC<OverviewDataViewProps> = ({
  metrics,
  targetMetricsConfig,
  timeGranularity,
  setTimeGranularity,
  aggregatedAndSortedMetrics,
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

  return (
    <>
      {/* Time Granularity Selector */}
      <div className="my-4 flex justify-end">
        <Select
          value={timeGranularity}
          onValueChange={(value) =>
            setTimeGranularity(value as typeof timeGranularity)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Time Granularity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                {' '}
                {/* Wrap Card in a div or use asChild directly on Card if supported by your Card component */}
                <Card>
                  <CardContent className="p-4">
                    <h4 className="text-lg font-semibold mb-2">
                      Avg. Conversion Rate
                    </h4>
                    <div className="text-3xl font-bold text-blue-600">
                      {(aggregatedAndSortedMetrics.length > 0 &&
                      aggregatedAndSortedMetrics.every(
                        (m) => typeof m.total_conversion_rate === 'number',
                      )
                        ? aggregatedAndSortedMetrics.reduce(
                            (sum, m) => sum + (m.total_conversion_rate || 0),
                            0,
                          ) / aggregatedAndSortedMetrics.length
                        : 0
                      ).toFixed(2)}
                      %
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
                    <div className="text-3xl font-bold text-green-600">
                      $
                      {aggregatedAndSortedMetrics
                        .reduce((sum, m) => sum + (m.total_sales || 0), 0)
                        .toLocaleString(undefined, {
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
                      {aggregatedAndSortedMetrics.length > 0
                        ? (
                            aggregatedAndSortedMetrics.reduce(
                              (sum, m) => sum + (m.ad_clicks || 0),
                              0,
                            ) / aggregatedAndSortedMetrics.length
                          ).toFixed(1)
                        : 0}
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

      {/* Period-over-Period Comparison Section */}
      {aggregatedAndSortedMetrics.length >= 2 && (
        <div className="mb-6">
          <h4 className="text-xl font-semibold mb-3">
            Period-over-Period Comparison (
            {timeGranularity.charAt(0).toUpperCase() + timeGranularity.slice(1)}
            )
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <ComparisonKpiCard
              title="Total Sales"
              currentValue={
                aggregatedAndSortedMetrics[
                  aggregatedAndSortedMetrics.length - 1
                ]?.total_sales
              }
              previousValue={
                aggregatedAndSortedMetrics[
                  aggregatedAndSortedMetrics.length - 2
                ]?.total_sales
              }
              unit="$"
            />
            <ComparisonKpiCard
              title="Total Orders"
              currentValue={
                aggregatedAndSortedMetrics[
                  aggregatedAndSortedMetrics.length - 1
                ]?.total_orders
              }
              previousValue={
                aggregatedAndSortedMetrics[
                  aggregatedAndSortedMetrics.length - 2
                ]?.total_orders
              }
              unit="$"
            />
            <ComparisonKpiCard
              title="Conversion Rate"
              currentValue={
                aggregatedAndSortedMetrics[
                  aggregatedAndSortedMetrics.length - 1
                ]?.total_conversion_rate
              }
              previousValue={
                aggregatedAndSortedMetrics[
                  aggregatedAndSortedMetrics.length - 2
                ]?.total_conversion_rate
              }
              unit="%"
              isPercentage
            />
            <ComparisonKpiCard
              title="ACoS"
              currentValue={
                aggregatedAndSortedMetrics[
                  aggregatedAndSortedMetrics.length - 1
                ]?.acos
              }
              previousValue={
                aggregatedAndSortedMetrics[
                  aggregatedAndSortedMetrics.length - 2
                ]?.acos
              }
              unit="%"
              higherIsBetter={false}
              isPercentage
            />
            <ComparisonKpiCard
              title="RoAS"
              currentValue={
                aggregatedAndSortedMetrics[
                  aggregatedAndSortedMetrics.length - 1
                ]?.roas
              }
              previousValue={
                aggregatedAndSortedMetrics[
                  aggregatedAndSortedMetrics.length - 2
                ]?.roas
              }
            />
          </div>
        </div>
      )}

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
