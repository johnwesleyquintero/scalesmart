import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
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
} from 'recharts';
import type { DashboardMetrics } from '@/lib/amazon-tools/types';

import { BRAND_CHART_COLORS } from '@/lib/constants/chart-colors';
import { theme } from '@/lib/theme';

const defaultColors = BRAND_CHART_COLORS;

interface ReusableChartProps {
  sortedMetrics: DashboardMetrics[];
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  chartType: 'line' | 'bar';
  xAxisDataKey: keyof DashboardMetrics;
  yAxisDataKeys: (keyof DashboardMetrics)[];
  colors?: string[];
  labels: string[];
  title: string;
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number, name: string) => [string, string];
  timeRange?: string;
  setTimeRange?: React.Dispatch<React.SetStateAction<string>>;
  events?: Array<{ date: string; title: string; description?: string }>;
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
  events,
}) => {
  const data = useMemo(() => {
    return sortedMetrics.map((metric) => {
      const xValue = metric[xAxisDataKey];
      // Initialize entry with the x-axis value, ensuring it's a string or number.
      // Dates are typically passed as strings to recharts.
      const entry: { [key: string]: string | number | undefined } = {
        [xAxisDataKey as string]:
          typeof xValue === 'string' || typeof xValue === 'number'
            ? xValue
            : String(xValue ?? ''), // Ensure xValue is string or number
      };

      yAxisDataKeys.forEach((key) => {
        const yValue = metric[key];
        // Ensure y-axis values are numbers or undefined for charting.
        entry[key as string] = typeof yValue === 'number' ? yValue : undefined;
      });
      return entry;
    });
  }, [sortedMetrics, xAxisDataKey, yAxisDataKeys]);

  const { theme, resolvedTheme } = useTheme();

  const bgColor = resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const titleBgColor = resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100';

  return (
    <div
      className={`${bgColor} shadow-md dark:shadow-lg rounded-lg overflow-hidden`}
    >
      <div className={`${titleBgColor} p-3 font-bold text-xl`}>{title}</div>
      {chartType === 'line' ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            width={500}
            height={300}
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={
                resolvedTheme === 'dark'
                  ? 'rgba(255,255,255,0.2)'
                  : 'rgba(0,0,0,0.2)'
              }
            />
            <XAxis
              dataKey={xAxisDataKey}
              stroke={resolvedTheme === 'dark' ? '#fff' : '#000'}
            />
            <YAxis
              type="number"
              tickFormatter={yAxisFormatter}
              stroke={resolvedTheme === 'dark' ? '#fff' : '#000'}
            />
            <Tooltip
              content={
                <CustomTooltip
                  formatter={tooltipFormatter}
                  events={events}
                  resolvedTheme={resolvedTheme || 'light'}
                />
              }
            />
            <Legend />
            {yAxisDataKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={
                  colors
                    ? colors[index % colors.length]
                    : defaultColors[index % defaultColors.length]
                }
                strokeWidth={2}
              />
            ))}
            {events &&
              events.map((event, index) => (
                <g key={index}>
                  <line
                    x={0}
                    y1={0}
                    y2={300}
                    stroke={
                      resolvedTheme === 'dark'
                        ? 'rgba(255,255,255,0.2)'
                        : 'rgba(0,0,0,0.2)'
                    }
                    strokeWidth={1}
                  />
                </g>
              ))}
          </LineChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  );
};

interface CustomTooltipProps extends RechartsTooltipProps<number, string> {
  // TValue is number, TName is string
  formatter?: (value: number, name: string) => [string, string];
  events?: Array<{ date: string; title: string; description?: string }>;
  resolvedTheme: string; // Add resolvedTheme prop
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  formatter,
  payload,
  active,
  label, // label for the X-axis value
  events,
  resolvedTheme, // Receive resolvedTheme prop
}) => {
  if (active && payload && payload.length && formatter) {
    const tooltipBgColor =
      resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white';
    const tooltipTextColor =
      resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900';
    return (
      <div className={`${tooltipBgColor} p-2 rounded shadow`}>
        {/* Display the X-axis label (e.g., date) */}
        {label && (
          <p
            className={`label font-semibold mb-1 ${tooltipTextColor}`}
          >{`${label}`}</p>
        )}
        {payload.map((entry, index) => {
          // entry.value is TValue (number), entry.name is TName (string)
          // The formatter expects (value: number, name: string)
          const [formattedValue, formattedName] = formatter(
            entry.value as number,
            entry.name as string,
          );
          return (
            <div
              key={`tooltip-item-${index}`}
              style={{ color: entry.color }}
              className={`text-sm ${tooltipTextColor}`}
            >
              {`${formattedName}: ${formattedValue}`}
            </div>
          );
        })}
      </div>
    );
  }

  return null;
};
