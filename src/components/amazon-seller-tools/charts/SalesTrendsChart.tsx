import React from 'react';
import { ReusableChart } from './ReusableChart';
import type { DashboardMetrics } from '@/app/amazon-seller-tools/page';

interface SalesTrendsChartProps {
  sortedMetrics: DashboardMetrics[];
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

export const SalesTrendsChart: React.FC<SalesTrendsChartProps> = ({
  sortedMetrics,
  granularity,
}) => {
  const SALES_LABEL = 'Sales';

  const yAxisFormatter = (value: number) => `$${value.toLocaleString()}`;

  const tooltipFormatter = (value: number): [string, string] => [
    `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    SALES_LABEL,
  ];

  return (
    <ReusableChart
      sortedMetrics={sortedMetrics}
      granularity={granularity}
      chartType="line"
      xAxisDataKey="date"
      yAxisDataKeys={['total_sales']}
      colors={['#8884d8']}
      labels={[SALES_LABEL]}
      title="Total Sales Trends"
      yAxisFormatter={yAxisFormatter}
      tooltipFormatter={tooltipFormatter}
    />
  );
};
