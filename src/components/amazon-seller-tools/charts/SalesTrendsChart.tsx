// src/components/amazon-seller-tools/charts/SalesTrendsChart.tsx
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
} from '@/lib/utils/amazon/chart-formatters'; // Assuming formatters are moved

const SALES_LABEL = 'Sales'; // Or pass as prop if it varies

interface SalesTrendsChartProps {
  sortedMetrics: DashboardMetrics[];
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

export const SalesTrendsChart: React.FC<SalesTrendsChartProps> = ({
  sortedMetrics,
  granularity,
}) => {
  const SALES_OR_DATE_NOT_AVAILABLE =
    'Total Sales or Date data not available for chart.';
  return (
    <Card>
      <CardContent className="p-4 h-[350px]">
        <h3 className="text-lg font-semibold mb-4">Total Sales Trends</h3>
        {sortedMetrics.length > 0 &&
        sortedMetrics[0]?.total_sales !== undefined &&
        sortedMetrics[0]?.date !== undefined ? (
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
              <YAxis />
              <Tooltip
                formatter={(value: number) => [
                  `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  SALES_LABEL,
                ]}
                labelFormatter={(label) =>
                  formatTooltipLabel(label, granularity)
                }
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="total_sales"
                stroke="#8884d8"
                name={SALES_LABEL}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">
            {SALES_OR_DATE_NOT_AVAILABLE}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
