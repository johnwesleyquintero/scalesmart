import React, { useMemo } from 'react';
import { ReusableChart } from './ReusableChart';
import type { DashboardMetrics } from '@/app/amazon-seller-tools/page';

interface ClicksImpressionsChartProps {
  sortedMetrics: DashboardMetrics[];
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

export const ClicksImpressionsChart: React.FC<ClicksImpressionsChartProps> = ({
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
      yAxisDataKeys={['ad_impressions', 'ad_clicks']}
      colors={['#e67e22', '#3498db']}
      labels={['Impressions', 'Clicks']}
      title="Impressions vs. Clicks"
      yAxisFormatter={yAxisFormatter}
      tooltipFormatter={tooltipFormatter}
    />
  );
};
