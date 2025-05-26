import React, { useState, useMemo } from 'react';
import { ReusableChart } from './ReusableChart';
import type { DashboardMetrics } from '@/app/amazon-seller-tools/page';

interface OrdersSessionsChartProps {
  sortedMetrics: DashboardMetrics[];
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

export const OrdersSessionsChart: React.FC<OrdersSessionsChartProps> = ({
  sortedMetrics,
  granularity,
}) => {
  const [timeRange, setTimeRange] = useState<string>('all');
  const TOTAL_ORDERS_LABEL = 'Total Orders';
  const TOTAL_SESSIONS_LABEL = 'Total Sessions';

  const tooltipFormatter = (value: number, name: string): [string, string] => {
    // `name` is the display label, e.g., "Total Orders" or "Total Sessions"
    if (name === TOTAL_ORDERS_LABEL) {
      return [`${value.toLocaleString()}`, TOTAL_ORDERS_LABEL];
    } else if (name === TOTAL_SESSIONS_LABEL) {
      return [`${value.toLocaleString()}`, TOTAL_SESSIONS_LABEL];
    }
    return [`${value.toLocaleString()}`, name]; // Fallback
  };

  const filteredMetrics = useMemo(() => {
    let filtered = sortedMetrics;

    if (timeRange === '7') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      filtered = filtered.filter(
        (metric) => new Date(metric.date as string) >= cutoff,
      );
    } else if (timeRange === '30') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      filtered = filtered.filter(
        (metric) => new Date(metric.date as string) >= cutoff,
      );
    } else if (timeRange === '90') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);
      filtered = filtered.filter(
        (metric) => new Date(metric.date as string) >= cutoff,
      );
    } else if (timeRange === 'ytd') {
      const cutoff = new Date(new Date().getFullYear(), 0, 1);
      filtered = filtered.filter(
        (metric) => new Date(metric.date as string) >= cutoff,
      );
    }

    return filtered;
  }, [sortedMetrics, timeRange]);

  return (
    <ReusableChart
      sortedMetrics={filteredMetrics}
      granularity={granularity}
      chartType="bar"
      xAxisDataKey="date"
      yAxisDataKeys={['total_orders', 'total_sessions']}
      colors={['#ffc658', '#fb8c00']}
      labels={[TOTAL_ORDERS_LABEL, TOTAL_SESSIONS_LABEL]}
      title="Total Orders & Total Sessions Over Time"
      tooltipFormatter={tooltipFormatter}
      timeRange={timeRange}
      setTimeRange={setTimeRange}
    />
  );
};
