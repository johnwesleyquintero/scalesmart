import React from 'react';
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
  const tooltipFormatter = (value: number, name: string): [string, string] => {
    if (name === 'ad_impressions') {
      return [`${value.toLocaleString()}`, 'Ad Impressions'];
    } else {
      return [`${value.toLocaleString()}`, 'Ad Clicks'];
    }
  };

  return (
    <ReusableChart
      sortedMetrics={sortedMetrics}
      granularity={granularity}
      chartType="bar"
      xAxisDataKey="date"
      yAxisDataKeys={['ad_impressions', 'ad_clicks']}
      colors={['#8884d8', '#82ca9d']}
      labels={['Ad Impressions', 'Ad Clicks']}
      title="Ad Clicks & Ad Impressions"
      tooltipFormatter={tooltipFormatter}
    />
  );
};
