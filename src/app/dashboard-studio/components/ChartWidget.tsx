import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ChartWidgetConfig } from '../widget-types';

interface ChartWidgetProps {
  config: ChartWidgetConfig;
}

export const ChartWidget: React.FC<ChartWidgetProps> = ({ config }) => {
  const { title, data, chartType, conditionalFormattingRules } = config;

  // TODO: The basic logic for applying conditional formatting based on config.conditionalFormattingRules is implemented for Bar and Pie charts by styling individual cells.
  // Consider enhancing this for more complex scenarios and implementing specific conditional formatting logic for Line charts (e.g., styling points or segments).

  const renderChart = () => {
    if (
      !data ||
      !data.labels ||
      data.labels.length === 0 ||
      !data.datasets ||
      data.datasets.length === 0
    ) {
      return <div className="text-gray-500">No data available</div>;
    }

    // Transform data to Recharts format and apply conditional formatting
    const transformedData = data.labels.map((label, index) => {
      const dataPoint: Record<string, string | number> = { name: label };
      let itemStyle: React.CSSProperties = {}; // Initialize with empty object and type assertion

      data.datasets.forEach((dataset) => {
        dataPoint[dataset.label] = dataset.data[index];
      });

      if (conditionalFormattingRules) {
        conditionalFormattingRules.forEach((rule) => {
          const dataValue = dataPoint[rule.field];
          let conditionMet = false;

          switch (rule.operator) {
            case 'gt':
              conditionMet =
                typeof dataValue === 'number' &&
                typeof rule.value === 'number' &&
                dataValue > rule.value;
              break;
            case 'lt':
              conditionMet =
                typeof dataValue === 'number' &&
                typeof rule.value === 'number' &&
                dataValue < rule.value;
              break;
            case 'eq':
              conditionMet = dataValue === rule.value;
              break;
            case 'gte':
              conditionMet =
                typeof dataValue === 'number' &&
                typeof rule.value === 'number' &&
                dataValue >= rule.value;
              break;
            case 'lte':
              conditionMet =
                typeof dataValue === 'number' &&
                typeof rule.value === 'number' &&
                dataValue <= rule.value;
              break;
            case 'ne':
              conditionMet = dataValue !== rule.value;
              break;
            case 'contains':
              conditionMet =
                typeof dataValue === 'string' &&
                typeof rule.value === 'string' &&
                dataValue.includes(rule.value);
              break;
            case 'not-contains':
              conditionMet =
                typeof dataValue === 'string' &&
                typeof rule.value === 'string' &&
                !dataValue.includes(rule.value);
              break;
            // Add more operators as needed
          }

          if (conditionMet) {
            itemStyle = { ...itemStyle, ...rule.style };
          }
        });
      }
      return { ...dataPoint, style: itemStyle };
    });

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={transformedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {data.datasets.map((dataset, datasetIndex) => (
                <Bar
                  key={`bar-${datasetIndex}`}
                  dataKey={dataset.label}
                  fill={dataset.backgroundColor || '#8884d8'}
                >
                  {transformedData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      style={entry.style}
                      fill={dataset.backgroundColor || '#8884d8'} // Keep original fill as a fallback if style doesn't provide one
                    />
                  ))}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={transformedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {data.datasets.map((dataset, datasetIndex) => (
                <Line
                  key={`line-${datasetIndex}`}
                  type="monotone"
                  dataKey={dataset.label}
                  stroke={dataset.borderColor || '#8884d8'}
                  dot={(props: {
                    cx?: number;
                    cy?: number;
                    stroke?: string;
                    key?: string;
                    payload?: {
                      name: string;
                      style?: React.CSSProperties;
                      [key: string]:
                        | string
                        | number
                        | React.CSSProperties
                        | undefined;
                    };
                  }) => {
                    const { cx, cy, stroke, key, payload } = props;
                    const dotStyle = payload?.style || {};
                    return (
                      <circle
                        key={key}
                        cx={cx}
                        cy={cy}
                        r={3} // Default radius
                        stroke={stroke}
                        fill={dotStyle.fill || stroke} // Use fill from style if available, otherwise use stroke
                        style={dotStyle}
                      />
                    );
                  }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie': {
        // Wrap in curly braces
        // For pie charts, conditional formatting typically applies to segments.
        // The data structure for pie charts in Recharts is an array of objects with value and name.
        // We need to adapt the transformation and conditional formatting for this.
        const pieData = data.labels.map((label, index) => {
          const value = data.datasets[0]?.data[index] || 0; // Assuming single dataset for pie
          let itemStyle: React.CSSProperties = {}; // Initialize with empty object and type assertion
          if (conditionalFormattingRules) {
            conditionalFormattingRules.forEach((rule) => {
              const dataValue = value; // For pie, rule applies to the segment value
              let conditionMet = false;

              switch (rule.operator) {
                case 'gt':
                  conditionMet =
                    typeof dataValue === 'number' &&
                    typeof rule.value === 'number' &&
                    dataValue > rule.value;
                  break;
                case 'lt':
                  conditionMet =
                    typeof dataValue === 'number' &&
                    typeof rule.value === 'number' &&
                    dataValue < rule.value;
                  break;
                case 'eq':
                  conditionMet = dataValue === rule.value;
                  break;
                case 'gte':
                  conditionMet =
                    typeof dataValue === 'number' &&
                    typeof rule.value === 'number' &&
                    dataValue >= rule.value;
                  break;
                case 'lte':
                  conditionMet =
                    typeof dataValue === 'number' &&
                    typeof rule.value === 'number' &&
                    dataValue <= rule.value;
                  break;
                case 'ne':
                  conditionMet = dataValue !== rule.value;
                  break;
                // 'contains' and 'not-contains' might not be applicable for numerical pie values
              }

              if (conditionMet) {
                itemStyle = { ...itemStyle, ...rule.style };
              }
            });
          }
          return { name: label, value: value, style: itemStyle };
        });

        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={50}
                fill="#8884d8"
                label
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    style={entry.style}
                    fill={
                      data.datasets[0]?.backgroundColor?.[index] ||
                      '#8884d8' /* Keep original fill as a fallback */
                    }
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      } // Close curly braces
      case 'geospatial-map':
        return (
          <div className="text-gray-500">
            Geospatial map chart type is not yet implemented.
          </div>
        );
      default:
        return (
          <div className="text-gray-500">
            Unsupported chart type: {chartType}
          </div>
        );
    }
  };

  return (
    <div className="border p-4 rounded-lg shadow-md h-full flex flex-col">
      {title && <h3 className="text-xl font-semibold mb-2">{title}</h3>}
      <div className="flex-grow flex items-center justify-center">
        {renderChart()}
      </div>
      {/* Displaying raw data for now */}
      {/* <div className="mt-2 text-sm text-gray-600">
        Data: {JSON.stringify(data)}
      </div> */}
      {conditionalFormattingRules && conditionalFormattingRules.length > 0 && (
        <div className="mt-2 text-sm text-gray-600">
          Conditional Formatting Rules Applied (Placeholder)
        </div>
      )}
    </div>
  );
};
