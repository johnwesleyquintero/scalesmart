// src/components/amazon-seller-tools/overview/OverviewDataView.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  DashboardMetrics,
  TargetMetricConfig,
} from '@/app/amazon-seller-tools/page'; // Adjust path if types are moved
import { ComparisonKpiCard } from './ComparisonKpiCard';
import { SalesTrendsChart } from '../charts/SalesTrendsChart';
import { ClicksImpressionsChart } from '../charts/ClicksImpressionsChart';
import { OrdersSessionsChart } from '../charts/OrdersSessionsChart';
import { AdSpendSalesChart } from '../charts/AdSpendSalesChart'; // New import
import { ProfitTrendChart } from '../charts/ProfitTrendChart'; // New import
import { MetricsDataTable } from './MetricsDataTable'; // New import
import { aggregateMetricsByTime } from '@/lib/utils/amazon/data-aggregation'; // Assuming aggregation logic is moved

interface OverviewDataViewProps {
  metrics: DashboardMetrics[];
  targetMetricsConfig: TargetMetricConfig[]; // Keep this if needed for future, or remove if not used by OverviewDataView directly
  onDeleteMetric: (metricDate: string, metricIdentifier?: string) => void; // Keep if delete functionality is part of this view
  timeGranularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  setTimeGranularity: (
    granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
  ) => void;
}

export const OverviewDataView: React.FC<OverviewDataViewProps> = ({
  metrics,
  // targetMetricsConfig, // Uncomment if used
  // onDeleteMetric, // Uncomment if used
  timeGranularity,
  setTimeGranularity,
}) => {
  // Initial sort for raw daily data if needed, then aggregate
  const dailySortedMetrics = [...metrics].sort(
    (a, b) =>
      new Date(a.date as string).getTime() -
      new Date(b.date as string).getTime(),
  );
  const aggregatedAndSortedMetrics = aggregateMetricsByTime(
    dailySortedMetrics,
    timeGranularity,
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
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-2">Avg. Conversion Rate</h3>
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
        <Card>
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
        <Card>
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
      </div>

      {/* Data Table Section */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Detailed Metrics Data</h3>
        <MetricsDataTable
          data={aggregatedAndSortedMetrics}
          granularity={timeGranularity}
        />
      </div>
    </>
  );
};
