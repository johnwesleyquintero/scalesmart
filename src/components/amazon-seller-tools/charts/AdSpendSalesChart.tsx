import React, { useState, useMemo } from 'react';
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
  const [timeRange, setTimeRange] = useState<string>('all');

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
      chartType="line"
      xAxisDataKey="date"
      yAxisDataKeys={['ad_spend', 'ad_sales']}
      colors={['#fa8072', '#20b2aa']}
      labels={['Ad Spend', 'Ad Sales']}
      title="Ad Spend vs. Ad Sales"
      yAxisFormatter={yAxisFormatter}
      tooltipFormatter={tooltipFormatter}
      timeRange={timeRange}
      setTimeRange={setTimeRange}
    />
  );
};
