// src/components/amazon-seller-tools/charts/AdSpendSalesChart.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  LineChart,
  Line,
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
} from '@/lib/utils/amazon/chart-formatters';

interface AdSpendSalesChartProps {
  sortedMetrics: DashboardMetrics[];
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

export const AdSpendSalesChart: React.FC<AdSpendSalesChartProps> = ({
  sortedMetrics,
  granularity,
}) => {
  const DATA_NOT_AVAILABLE =
    'Ad Spend, Ad Sales or Date data not available for chart.';

  return (
    <Card>
      <CardContent className="p-4 h-[350px]">
        <h3 className="text-lg font-semibold mb-4">Ad Spend vs. Ad Sales</h3>
        {sortedMetrics.length > 0 &&
        sortedMetrics.every(
          (m) =>
            m.date &&
            typeof m.ad_spend === 'number' &&
            typeof m.ad_sales === 'number',
        ) ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={sortedMetrics}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(tick) => formatTick(tick, granularity)}
              />
              <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  name === 'ad_spend' ? 'Ad Spend' : 'Ad Sales',
                ]}
                labelFormatter={(label) =>
                  formatTooltipLabel(label, granularity)
                }
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="ad_spend"
                stroke="#fa8072" // Salmon
                name="Ad Spend"
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="ad_sales"
                stroke="#20b2aa" // LightSeaGreen
                name="Ad Sales"
                activeDot={{ r: 6 }}
              />
            </LineChart>
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
