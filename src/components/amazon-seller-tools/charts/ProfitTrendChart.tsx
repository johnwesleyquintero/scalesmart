// src/components/amazon-seller-tools/charts/ProfitTrendChart.tsx
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

interface ProfitTrendChartProps {
  sortedMetrics: DashboardMetrics[];
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

export const ProfitTrendChart: React.FC<ProfitTrendChartProps> = ({
  sortedMetrics,
  granularity,
}) => {
  const DATA_NOT_AVAILABLE = 'Profit or Date data not available for chart.';

  return (
    <Card>
      <CardContent className="p-4 h-[350px]">
        <h3 className="text-lg font-semibold mb-4">Profit Trend</h3>
        {sortedMetrics.length > 0 &&
        sortedMetrics.every((m) => m.date && typeof m.profit === 'number') ? (
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
                formatter={(value: number) => [
                  `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  'Profit',
                ]}
                labelFormatter={(label) =>
                  formatTooltipLabel(label, granularity)
                }
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#32cd32" // LimeGreen
                name="Profit"
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
