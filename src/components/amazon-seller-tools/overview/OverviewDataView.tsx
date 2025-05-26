// src/components/amazon-seller-tools/overview/OverviewDataView.tsx
import React, { useMemo } from 'react';
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
import TableChart, { ColumnDef } from '@/components/ui/TableChart';
import type {
  DashboardMetrics,
  TargetMetricConfig,
} from '@/app/amazon-seller-tools/page';
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
}

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

        let cellRenderer:
          | ((value: number | string, row: DashboardMetrics) => React.ReactNode)
          | undefined;
        if (
          key === 'total_sales' ||
          key === 'ad_spend' ||
          key === 'ad_sales' ||
          key === 'profit'
        ) {
          cellRenderer = (value: number) =>
            value !== undefined && value !== null
              ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : 'N/A';
        } else if (
          key === 'total_conversion_rate' ||
          key === 'acos' ||
          key === 'roas'
        ) {
          cellRenderer = (value: number) =>
            value !== undefined && value !== null
              ? `${value.toFixed(2)}%`
              : 'N/A';
        } else if (
          typeof config.key === 'string' &&
          config.key.includes('date')
        ) {
          cellRenderer = (value: string) => {
            try {
              const date = new Date(value);
              return date.toLocaleDateString(); // Format date nicely
            } catch {
              return value;
            }
          };
        } else {
          cellRenderer = (value: string) =>
            value !== undefined && value !== null ? String(value) : 'N/A';
        }

        return {
          accessorKey: key,
          header: config.label,
          sortable: true, // Enable sorting for all displayed columns
          cell: cellRenderer,
        };
      })
      .filter(
        (column): column is ColumnDef<DashboardMetrics> => column !== null,
      );
  }, [targetMetricsConfig]);

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
            <TooltipTrigger>
              <Card title="Average Conversion Rate: Calculated as (Total Orders / Total Sessions) * 100.  This represents the percentage of website visits that resulted in a purchase.  A higher percentage indicates better website performance and customer engagement.">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-2">
                    Avg. Conversion Rate
                  </h3>
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
            </TooltipTrigger>
            <TooltipContent>
              Average Conversion Rate: Calculated as (Total Orders / Total
              Sessions) * 100. This represents the percentage of website visits
              that resulted in a purchase. A higher percentage indicates better
              website performance and customer engagement.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Card title="Total Sales: The sum of all sales recorded during the selected period. This represents your total revenue generated from sales.">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-2">Total Sales</h3>
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
            </TooltipTrigger>
            <TooltipContent>
              Total Sales: The sum of all sales recorded during the selected
              period. This represents your total revenue generated from sales.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Card title="Average Clicks: The average number of clicks on your advertisements during the selected period. This metric reflects the effectiveness of your ad campaigns in attracting customer attention.">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-2">Avg. Clicks</h3>
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
            </TooltipTrigger>
            <TooltipContent>
              Average Clicks: The average number of clicks on your
              advertisements during the selected period. This metric reflects
              the effectiveness of your ad campaigns in attracting customer
              attention.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Period-over-Period Comparison Section */}
      {aggregatedAndSortedMetrics.length >= 2 && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3">
            Period-over-Period Comparison (
            {timeGranularity.charAt(0).toUpperCase() + timeGranularity.slice(1)}
            )
          </h3>
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
        />
      </div>

      {/* Data Table */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-3">Detailed Metrics Table</h3>
        <TableChart
          data={aggregatedAndSortedMetrics}
          columns={tableColumns}
          stripedRows
          enablePagination
          initialPageSize={10}
        />
      </div>
    </>
  );
};
