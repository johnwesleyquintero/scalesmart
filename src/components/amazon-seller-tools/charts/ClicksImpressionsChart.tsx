// src/components/amazon-seller-tools/charts/ClicksImpressionsChart.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { DashboardMetrics } from '@/app/amazon-seller-tools/page'; // Adjust path if DashboardMetrics is moved
import {
  formatTick,
  formatTooltipLabel,
} from '@/lib/utils/amazon/chart-formatters'; // Assuming formatters are moved

interface ClicksImpressionsChartProps {
  sortedMetrics: DashboardMetrics[];
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

export const ClicksImpressionsChart: React.FC<ClicksImpressionsChartProps> = ({
  sortedMetrics,
  granularity,
}) => {
  const DATA_NOT_AVAILABLE =
    'Ad Clicks, Ad Impressions or Date data not available for chart.';
  return (
    <Card>
      <CardContent className="p-4 h-[350px]">
        <h3 className="text-lg font-semibold mb-4">
          Ad Clicks & Ad Impressions
        </h3>
        {sortedMetrics.length > 0 &&
        sortedMetrics[0]?.ad_clicks !== undefined &&
        sortedMetrics[0]?.ad_impressions !== undefined &&
        sortedMetrics[0]?.date !== undefined ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedMetrics}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(tick) => formatTick(tick, granularity)}
              />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip
                labelFormatter={(label) =>
                  formatTooltipLabel(label, granularity)
                }
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="ad_impressions"
                fill="#8884d8"
                name="Ad Impressions"
              />
              <Bar
                yAxisId="right"
                dataKey="ad_clicks"
                fill="#82ca9d"
                name="Ad Clicks"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">
            {DATA_NOT_AVAILABLE}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
