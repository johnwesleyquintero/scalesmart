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

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="bg-gray-100 p-3 font-bold text-xl">{title}</div>
      {chartType === 'line' ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            width={500}
            height={300}
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisDataKey} />
            <YAxis type="number" tickFormatter={yAxisFormatter} />
            <Tooltip
              content={
                <CustomTooltip formatter={tooltipFormatter} events={events} />
              }
            />
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
            {events && 
              events.map((event, index) => (
                <g key={index}>
                  <line
                    x={0}
                    y1={0}
                    y2={300}
                    stroke="rgba(0,0,0,0.2)"
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
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  formatter,
  payload,
  active,
  label, // label for the X-axis value
  events,
}) => {
  if (active && payload && payload.length && formatter) {
    return (
      <div className="bg-gray-100 p-2 rounded shadow">
        {/* Display the X-axis label (e.g., date) */}
        {label && <p className="label font-semibold mb-1">{`${label}`}</p>}
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
              className="text-sm"
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
