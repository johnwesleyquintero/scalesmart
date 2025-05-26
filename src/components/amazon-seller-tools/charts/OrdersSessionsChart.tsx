import React, { useMemo } from 'react';
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
  const yAxisFormatter = (value: number) => value.toLocaleString();

  const tooltipFormatter = (value: number, name: string): [string, string] => [
    value.toLocaleString(),
    name,
  ];

  return (
    <ReusableChart
      sortedMetrics={sortedMetrics}
      granularity={granularity}
      chartType="line"
      xAxisDataKey="date"
      yAxisDataKeys={['total_orders', 'total_sessions']}
      colors={['#1abc9c', '#f1c40f']}
      labels={['Orders', 'Sessions']}
      title="Orders vs. Sessions"
      yAxisFormatter={yAxisFormatter}
      tooltipFormatter={tooltipFormatter}
    />
  );
};
