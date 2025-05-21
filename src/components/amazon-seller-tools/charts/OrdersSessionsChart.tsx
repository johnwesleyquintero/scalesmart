// src/components/amazon-seller-tools/charts/OrdersSessionsChart.tsx
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

interface OrdersSessionsChartProps {
  sortedMetrics: DashboardMetrics[];
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

export const OrdersSessionsChart: React.FC<OrdersSessionsChartProps> = ({
  sortedMetrics,
  granularity,
}) => {
  const DATA_NOT_AVAILABLE =
    'Total Orders, Total Sessions or Date data not available for chart.';
  return (
    <Card>
      <CardContent className="p-4 h-[350px]">
        <h3 className="text-lg font-semibold mb-4">
          Total Orders & Total Sessions Over Time
        </h3>
        {sortedMetrics.length > 0 &&
        sortedMetrics[0]?.total_orders !== undefined &&
        sortedMetrics[0]?.total_sessions !== undefined &&
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
              <YAxis />
              <Tooltip
                formatter={(value: number, name: string) => [
                  value,
                  name === 'total_orders' ? 'Total Orders' : 'Total Sessions',
                ]}
                labelFormatter={(label) =>
                  formatTooltipLabel(label, granularity)
                }
              />
              <Legend />
              <Bar dataKey="total_orders" fill="#ffc658" name="Total Orders" />
              <Bar
                dataKey="total_sessions"
                fill="#fb8c00"
                name="Total Sessions"
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
