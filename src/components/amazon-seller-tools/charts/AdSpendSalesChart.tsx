import React from 'react';
import { ReusableChart } from './ReusableChart';
import type { DashboardMetrics } from '@/app/amazon-seller-tools/page';

interface AdSpendSalesChartProps {
  sortedMetrics: DashboardMetrics[];
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

export const AdSpendSalesChart: React.FC<AdSpendSalesChartProps> = ({
  sortedMetrics,
  granularity,
}) => {
  const yAxisFormatter = (value: number) => `$${value.toLocaleString()}`;

  const tooltipFormatter = (value: number, name: string): [string, string] => {
    if (name === 'ad_spend') {
      return [
        `$${value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        'Ad Spend',
      ];
    } else {
      return [
        `$${value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        'Ad Sales',
      ];
    }
  };

  return (
    <ReusableChart
      sortedMetrics={sortedMetrics}
      granularity={granularity}
      chartType="line"
      xAxisDataKey="date"
      yAxisDataKeys={['ad_spend', 'ad_sales']}
      colors={['#fa8072', '#20b2aa']}
      labels={['Ad Spend', 'Ad Sales']}
      title="Ad Spend vs. Ad Sales"
      yAxisFormatter={yAxisFormatter}
      tooltipFormatter={tooltipFormatter}
    />
  );
};
