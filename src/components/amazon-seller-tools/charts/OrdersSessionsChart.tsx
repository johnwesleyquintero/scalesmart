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

  const tooltipFormatter = (value: number, name: string): [string, string] => {
    if (name === 'total_orders') {
      return [`${value.toLocaleString()}`, 'Total Orders'];
    } else {
      return [`${value.toLocaleString()}`, 'Total Sessions'];
    }
  };

  const filteredMetrics = useMemo(() => {
    let filtered = sortedMetrics;

    if (timeRange === '7') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      filtered = filtered.filter((metric) => new Date(metric.date as string) >= cutoff);
    } else if (timeRange === '30') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      filtered = filtered.filter((metric) => new Date(metric.date as string) >= cutoff);
    } else if (timeRange === '90') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);
      filtered = filtered.filter((metric) => new Date(metric.date as string) >= cutoff);
    } else if (timeRange === 'ytd') {
      const cutoff = new Date(new Date().getFullYear(), 0, 1);
      filtered = filtered.filter((metric) => new Date(metric.date as string) >= cutoff);
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
      labels={['Total Orders', 'Total Sessions']}
      title="Total Orders & Total Sessions Over Time"
      tooltipFormatter={tooltipFormatter}
      timeRange={timeRange}
      setTimeRange={setTimeRange}
    />
  );
};
