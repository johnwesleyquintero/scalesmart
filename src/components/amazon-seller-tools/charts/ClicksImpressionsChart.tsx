import React, { useState, useMemo } from 'react';
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
  const [timeRange, setTimeRange] = useState<string>('all');
  const AD_IMPRESSIONS_LABEL = 'Ad Impressions';
  const AD_CLICKS_LABEL = 'Ad Clicks';

  const tooltipFormatter = (value: number, name: string): [string, string] => {
    // `name` is the display label, e.g., "Ad Impressions" or "Ad Clicks"
    if (name === AD_IMPRESSIONS_LABEL) {
      return [`${value.toLocaleString()}`, AD_IMPRESSIONS_LABEL];
    } else if (name === AD_CLICKS_LABEL) {
      return [`${value.toLocaleString()}`, AD_CLICKS_LABEL];
    }
    return [`${value.toLocaleString()}`, name]; // Fallback
  };

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
      chartType="bar"
      xAxisDataKey="date"
      yAxisDataKeys={['ad_impressions', 'ad_clicks']}
      colors={['#8884d8', '#82ca9d']}
      labels={[AD_IMPRESSIONS_LABEL, AD_CLICKS_LABEL]}
      title="Ad Clicks & Ad Impressions"
      tooltipFormatter={tooltipFormatter}
      timeRange={timeRange}
      setTimeRange={setTimeRange}
    />
  );
};
