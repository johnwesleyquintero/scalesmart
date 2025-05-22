import React from 'react';
import { JSX } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { DashboardMetrics } from '@/app/amazon-seller-tools/page';
import {
  formatTick,
  formatTooltipLabel,
} from '@/lib/utils/amazon/chart-formatters';

interface ReusableChartProps {
  sortedMetrics: DashboardMetrics[];
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  chartType: 'line' | 'bar';
  xAxisDataKey: string;
  yAxisDataKeys: string[];
  colors: string[];
  labels: string[];
  title: string;
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number, name: string) => [string, string];
  timeRange?: string;
  setTimeRange?: (timeRange: string) => void | undefined;
}

export const ReusableChart: React.FC<ReusableChartProps> = ({
  sortedMetrics,
  granularity,
  chartType,
  xAxisDataKey,
  yAxisDataKeys,
  colors,
  labels,
  title,
  yAxisFormatter,
  tooltipFormatter,
  timeRange,
  setTimeRange,
}) => {
  const DATA_NOT_AVAILABLE = 'Data not available for chart.';

  const renderChart = (): JSX.Element => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart
            data={sortedMetrics}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={xAxisDataKey}
              tickFormatter={(tick) => formatTick(tick, granularity)}
            />
            <YAxis tickFormatter={yAxisFormatter} />
            <Tooltip
              formatter={tooltipFormatter}
              labelFormatter={(label) => formatTooltipLabel(label, granularity)}
            />
            <Legend />
            {yAxisDataKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                name={labels[index % labels.length]}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );
      case 'bar':
        return (
          <BarChart
            data={sortedMetrics}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={xAxisDataKey}
              tickFormatter={(tick) => formatTick(tick, granularity)}
            />
            <YAxis />
            <Tooltip
              formatter={tooltipFormatter}
              labelFormatter={(label) => formatTooltipLabel(label, granularity)}
            />
            <Legend />
            {yAxisDataKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                name={labels[index % labels.length]}
              />
            ))}
          </BarChart>
        );
      default:
        return <div />;
    }
  };

  const isDataAvailable =
    sortedMetrics.length > 0 &&
    sortedMetrics.every(
      (m) => m.date && yAxisDataKeys.every((key) => typeof m[key] === 'number'),
    );

  return (
    <Card>
      <CardContent className="p-4 h-[350px]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          {/* Time Range Selector - Render only if setTimeRange is provided */}
          {setTimeRange && (
            <div>
              <Select
                value={timeRange}
                onValueChange={(value) => {
                  setTimeRange(value);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                  <SelectItem value="ytd">Year to Date</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        {isDataAvailable ? (
          chartType === 'line' || chartType === 'bar' ? (
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          ) : (
            <div></div>
          )
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">
            {DATA_NOT_AVAILABLE}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
