import React, { useMemo } from 'react';
import { ReusableChart } from './ReusableChart';
import type { DashboardMetrics } from '@/lib/amazon-tools/types';

interface ProfitTrendChartProps {
  sortedMetrics: DashboardMetrics[];
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

export const ProfitTrendChart: React.FC<ProfitTrendChartProps> = ({
  sortedMetrics,
  granularity,
}) => {
  const yAxisFormatter = (value: number) => `$${value.toLocaleString()}`;

  const tooltipFormatter = (value: number, name: string): [string, string] => [
    `$${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    name,
  ];

  return (
    <ReusableChart
      sortedMetrics={sortedMetrics}
      granularity={granularity}
      chartType="line"
      xAxisDataKey="date"
      yAxisDataKeys={['profit']}
      labels={['Profit']}
      title="Profit Trend"
      yAxisFormatter={yAxisFormatter}
      tooltipFormatter={tooltipFormatter}
    />
  );
};
