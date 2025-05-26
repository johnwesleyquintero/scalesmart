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
import type { Payload } from 'recharts/types/component/DefaultTooltipContent'; // Correct import path for Payload

import type { DashboardMetrics } from '@/app/amazon-seller-tools/page';
import {
  formatTick,
  formatTooltipLabel,
  enhancedTooltipFormatter,
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
  tooltipFormatter?: (
    value: number,
    name: string,
    dataPoint: DashboardMetrics,
    granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    sortedMetrics: DashboardMetrics[],
  ) => [React.ReactNode, React.ReactNode];
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
              formatter={(
                value: number,
                name: string,
                entry: Payload<number, string>,
              ): [React.ReactNode, React.ReactNode] | React.ReactNode => {
                // Check if entry.payload exists and tooltipFormatter is provided
                if (tooltipFormatter && entry.payload) {
                  // Assuming entry.payload is compatible with DashboardMetrics
                  const dataPoint =
                    entry.payload as unknown as DashboardMetrics;
                  return tooltipFormatter(
                    value,
                    name,
                    dataPoint,
                    granularity,
                    sortedMetrics,
                  );
                }
                const labelIndex = yAxisDataKeys.indexOf(name);
                const displayName =
                  labelIndex !== -1 ? labels[labelIndex] : name;
                return [value.toString(), displayName];
              }}
              labelFormatter={(label: string | number | Date) =>
                formatTooltipLabel(label, granularity)
              }
            />
            <Legend />
            {yAxisDataKeys.map((key, index) => {
              const colorIndex = index % colors.length;
              return (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[colorIndex]}
                  name={labels[index % labels.length]}
                  activeDot={{ r: 6 }}
                />
              );
            })}
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
              formatter={(
                value: number,
                name: string,
                entry: Payload<number, string>,
              ): [React.ReactNode, React.ReactNode] | React.ReactNode => {
                // Check if entry.payload exists and tooltipFormatter is provided
                if (tooltipFormatter && entry.payload) {
                  // Assuming entry.payload is compatible with DashboardMetrics
                  const dataPoint =
                    entry.payload as unknown as DashboardMetrics;
                  return tooltipFormatter(
                    value,
                    name,
                    dataPoint,
                    granularity,
                    sortedMetrics,
                  );
                }
                const labelIndex = yAxisDataKeys.indexOf(name);
                const displayName =
                  labelIndex !== -1 ? labels[labelIndex] : name;
                return [value.toString(), displayName];
              }}
              labelFormatter={(label: string | number | Date) =>
                formatTooltipLabel(label, granularity)
              }
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

  const getEmptyStateMessage = () => {
    if (sortedMetrics.length === 0) {
      return (
        <>
          No data available for this chart.
          <br />
          Please upload a CSV file or adjust your time range/filters.
        </>
      );
    }
    return 'Data not available for chart.';
  };

  return (
    <Card>
      <CardContent className="p-4 h-[350px]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
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
            {getEmptyStateMessage()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
