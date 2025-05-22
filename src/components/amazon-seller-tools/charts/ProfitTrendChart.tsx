import React, { useState, useMemo } from 'react';
import { ReusableChart } from './ReusableChart';
import type { DashboardMetrics } from '@/app/amazon-seller-tools/page';

interface ProfitTrendChartProps {
  sortedMetrics: DashboardMetrics[];
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

export const ProfitTrendChart: React.FC<ProfitTrendChartProps> = ({
  sortedMetrics,
  granularity,
}) => {
  const [timeRange, setTimeRange] = useState<string>('all');

  const yAxisFormatter = (value: number) => `$${value.toLocaleString()}`;

  const tooltipFormatter = (value: number): [string, string] => [
    `$${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    'Profit',
  ];

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
      chartType="line"
      xAxisDataKey="date"
      yAxisDataKeys={['profit']}
      colors={['#32cd32']}
      labels={['Profit']}
      title="Profit Trend"
      yAxisFormatter={yAxisFormatter}
      tooltipFormatter={tooltipFormatter}
      timeRange={timeRange}
      setTimeRange={setTimeRange}
    />
  );
};
