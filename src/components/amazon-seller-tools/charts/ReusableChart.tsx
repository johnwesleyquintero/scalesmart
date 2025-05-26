import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps as RechartsTooltipProps,
  TooltipPayload as RechartsTooltipPayload,
} from 'recharts';
import type { DashboardMetrics } from '@/app/amazon-seller-tools/page';

interface ReusableChartProps {
  sortedMetrics: DashboardMetrics[];
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  chartType: 'line' | 'bar';
  xAxisDataKey: keyof DashboardMetrics;
  yAxisDataKeys: (keyof DashboardMetrics)[];
  colors: string[];
  labels: string[];
  title: string;
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number, name: string) => [string, string];
  timeRange?: string;
  setTimeRange?: React.Dispatch<React.SetStateAction<string>>;
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
  yAxisFormatter = (value) => value.toLocaleString(),
  tooltipFormatter = (value, name) => [value.toLocaleString(), name],
  timeRange = 'all',
  setTimeRange,
}) => {
  const data = useMemo(() => {
    return sortedMetrics.map((metric) => {
      const entry: { [key: string]: number | string | undefined } = {};
      entry[xAxisDataKey] = metric[xAxisDataKey];
      yAxisDataKeys.forEach((key) => {
        entry[key] = metric[key];
      });
      return entry;
    });
  }, [sortedMetrics, xAxisDataKey, yAxisDataKeys]);

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="bg-gray-100 p-3 font-bold text-xl">{title}</div>
      <ResponsiveContainer width="100%" height={300}>
        {chartType === 'line' ? (
          <LineChart
            width={500}
            height={300}
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisDataKey} />
            <YAxis type="number" tickFormatter={yAxisFormatter} />
            <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />
            <Legend />
            {yAxisDataKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index]}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        ) : (
          <></>
        )}
      </ResponsiveContainer>
    </div>
  );
};

interface CustomTooltipProps
  extends RechartsTooltipProps<{ value: number; name: string }> {
  formatter?: (value: number, name: string) => [string, string];
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  formatter,
  payload,
  active,
}) => {
  if (active && payload && formatter) {
    return (
      <div className="bg-gray-100 p-2 rounded shadow">
        {payload.map(
          (
            item: RechartsTooltipPayload<{ value: number; name: string }>,
            i: number,
          ) => (
            <div key={i}>
              <span>{formatter(item.value, item.name)[0]}</span>{' '}
              <span>{formatter(item.value, item.name)[1]}</span>
            </div>
          ),
        )}
      </div>
    );
  }

  return null;
};
