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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import type {
  DashboardMetrics,
  TargetMetricConfig,
} from '@/app/amazon-seller-tools/page';
import { TimeRange } from '@/lib/amazon-tools/types';
import { ComparisonKpiCard } from './ComparisonKpiCard';
import { SalesTrendsChart } from '../charts/SalesTrendsChart';
import { ClicksImpressionsChart } from '../charts/ClicksImpressionsChart';
import { OrdersSessionsChart } from '../charts/OrdersSessionsChart';
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
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  customDateRange: { from: Date | undefined; to: Date | undefined };
  setCustomDateRange: React.Dispatch<
    React.SetStateAction<{ from: Date | undefined; to: Date | undefined }>
  >;
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
  onDeleteMetric,
  timeGranularity,
  setTimeGranularity,
  aggregatedAndSortedMetrics,
  timeRange,
  setTimeRange,
  customDateRange,
  setCustomDateRange,
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
      {/* Time Granularity & Range Selectors */}
      <div className="my-4 flex items-center justify-end space-x-4">
        <div className="flex items-center space-x-2">
          <Label htmlFor="time-granularity-select">Granularity:</Label>
          <Select
            value={timeGranularity}
            onValueChange={(value) =>
              setTimeGranularity(value as typeof timeGranularity)
            }
          >
            <SelectTrigger id="time-granularity-select" className="w-[180px]">
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
        {/* Time range selector in OverviewDataView as well (not in OverviewTab) */}
        <div className="flex items-center space-x-2">
          <Label htmlFor="time-range-select">Time Range:</Label>
          <Select
            value={timeRange}
            onValueChange={(value: TimeRange) => setTimeRange(value)}
          >
            <SelectTrigger id="time-range-select" className="w-[180px]">
              {timeRange === 'last_7_days' && 'Last 7 Days'}
              {timeRange === 'last_30_days' && 'Last 30 Days'}
              {timeRange === 'month_to_date' && 'Month to Date'}
              {timeRange === 'year_to_date' && 'Year to Date'}
              {timeRange === 'all_time' && 'All Time'}
              {timeRange === 'custom' && 'Custom Range'}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">Last 7 Days</SelectItem>
              <SelectItem value="last_30_days">Last 30 Days</SelectItem>
              <SelectItem value="month_to_date">Month to Date</SelectItem>
              <SelectItem value="year_to_date">Year to Date</SelectItem>
              <SelectItem value="all_time">All Time</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {timeRange === 'custom' && (
          <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-[280px] justify-start text-left font-normal',
                    !customDateRange.from && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDateRange.from ? (
                    customDateRange.to ? (
                      <>
                        {format(customDateRange.from, 'PPP')} -{' '}
                        {format(customDateRange.to, 'PPP')}
                      </>
                    ) : (
                      format(customDateRange.from, 'PPP')
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={customDateRange}
                  onSelect={(range) => {
                    if (range) {
                      setCustomDateRange({
                        from: range.from,
                        to: range.to,
                      });
                    }
                  }}
                  numberOfMonths={2}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

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
