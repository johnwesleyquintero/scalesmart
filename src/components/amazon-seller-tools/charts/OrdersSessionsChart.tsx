import React from 'react';
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
  const tooltipFormatter = (value: number, name: string): [string, string] => {
    if (name === 'total_orders') {
      return [`${value.toLocaleString()}`, 'Total Orders'];
    } else {
      return [`${value.toLocaleString()}`, 'Total Sessions'];
    }
  };

  return (
    
      <ReusableChart
        sortedMetrics={sortedMetrics}
        granularity={granularity}
        chartType="bar"
        xAxisDataKey="date"
        yAxisDataKeys={['total_orders', 'total_sessions']}
        colors={['#ffc658', '#fb8c00']}
        labels={['Total Orders', 'Total Sessions']}
        title="Total Orders & Total Sessions Over Time"
        tooltipFormatter={tooltipFormatter}
      />
    
  );
};
