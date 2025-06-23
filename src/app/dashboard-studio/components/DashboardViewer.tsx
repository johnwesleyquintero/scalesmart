'use client';

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { FixedSizeList } from 'react-window';

type WidgetData = Record<string, unknown>;

interface DashboardViewerProps {
  dashboardId: string;
}

interface Widget {
  id: string;
  type: string; // e.g., 'chart', 'table', 'text'
  config: ChartWidgetConfig | TableWidgetConfig; // Widget-specific configuration
}

// Helper function for lazy loading named exports
import {
  ChartWidgetConfig,
  TableWidgetConfig,
  WidgetConfig,
} from '../widget-types';

// Helper function for lazy loading named exports

// Define a mapping from widget type to component
const widgetComponents: Record<
  string,
  React.ComponentType<{ config: WidgetConfig }>
> = {
  chart: lazy(() =>
    import('./ChartWidget').then((module) => ({
      default: module.ChartWidget as React.ComponentType<{
        config: WidgetConfig;
      }>,
    })),
  ),
  table: lazy(() =>
    import('./TableWidget').then((module) => ({
      default: module.TableWidget as React.ComponentType<{
        config: WidgetConfig;
      }>,
    })),
  ),
  // Add other widget types here
};

// Component to render a lazy-loaded widget
const LazyWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
  const WidgetComponent = widgetComponents[widget.type];

  if (!WidgetComponent) {
    return <p>Unknown widget type: {widget.type}</p>;
  }

  return (
    <Suspense fallback={<div>Loading widget...</div>}>
      <WidgetComponent config={widget.config} />{' '}
      {/* Pass widget config as 'config' prop */}
    </Suspense>
  );
};

export const DashboardViewer: React.FC<DashboardViewerProps> = ({
  dashboardId,
}) => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Simulate fetching dashboard data based on dashboardId
    // In a real application, this would be an API call
    const simulatedFetch = async () => {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Generate some dummy widgets for demonstration
      const dummyWidgets: Widget[] = Array.from({ length: 50 }).map(
        (_, index) => ({
          id: `widget-${index}`,
          type: index % 2 === 0 ? 'chart' : 'table',
          config:
            index % 2 === 0
              ? {
                  // Dummy ChartWidgetConfig
                  id: `chart-config-${index}`,
                  type: 'chart',
                  title: `Chart ${index}`,
                  x: (index % 4) * 6, // Placeholder x
                  y: Math.floor(index / 4) * 6, // Placeholder y
                  w: 6, // Placeholder width
                  h: 6, // Placeholder height
                  chartType: 'bar', // or 'line', 'pie'
                  data: {
                    labels: ['A', 'B', 'C'],
                    datasets: [
                      {
                        label: 'Series 1',
                        data: [
                          Math.random() * 100,
                          Math.random() * 100,
                          Math.random() * 100,
                        ],
                      },
                    ],
                  },
                }
              : {
                  // Dummy TableWidgetConfig
                  id: `table-config-${index}`,
                  type: 'table',
                  title: `Table ${index}`,
                  x: (index % 4) * 6, // Placeholder x
                  y: Math.floor(index / 4) * 6, // Placeholder y
                  w: 6, // Placeholder width
                  h: 6, // Placeholder height
                  data: {
                    headers: ['Column 1', 'Column 2'],
                    rows: [
                      [`Row ${index} Data 1`, `Row ${index} Data 2`],
                      [`Row ${index} Data 3`, `Row ${index} Data 4`],
                    ],
                  },
                },
        }),
      );

      // Implement data aggregation for large table datasets
      const optimizedWidgets = dummyWidgets.map((widget) => {
        // Check if it's a table widget and has a large number of rows
        if (widget.type === 'table' && widget.config.data) {
          const tableConfig = widget.config as TableWidgetConfig; // Type assertion
          if (tableConfig.data.rows && tableConfig.data.rows.length > 100) {
            // Simulate data aggregation: calculate average of the third column (assuming it's numeric)
            const totalValue = tableConfig.data.rows.reduce((sum, row) => {
              const value = parseFloat(row[2]);
              return isNaN(value) ? sum : sum + value;
            }, 0);
            const averageValue = totalValue / tableConfig.data.rows.length;

            return {
              ...widget,
              config: {
                ...tableConfig, // Use tableConfig here
                data: {
                  headers: tableConfig.data.headers, // Access headers from tableConfig
                  // Replace large data with aggregated summary
                  rows: [
                    [
                      'Aggregated Data',
                      'Average Value',
                      averageValue.toFixed(2),
                    ],
                  ],
                },
              },
            };
          }
        }
        return widget;
      });

      setWidgets(optimizedWidgets);
      setLoading(false);
    };

    simulatedFetch();
  }, [dashboardId]); // Re-run effect when dashboardId changes

  return (
    <div className="border p-4 rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">
        Viewing Dashboard: {dashboardId}
      </h2>
      {loading ? (
        <p>Loading dashboard...</p>
      ) : (
        <div style={{ height: 500, width: '100%' }}>
          {' '}
          {/* Container with fixed dimensions */}
          <FixedSizeList
            height={500} // Height of the list container
            itemCount={widgets.length} // Total number of items
            itemSize={268} // Height of each item (h-64 + padding/border) - approximate
            width={'100%'} // Width of the list container
          >
            {({
              index,
              style,
            }: {
              index: number;
              style: React.CSSProperties;
            }) => {
              const widget = widgets[index];
              return (
                <div
                  style={style}
                  key={widget.id}
                  className="border p-4 rounded-lg h-64"
                >
                  {' '}
                  {/* Removed flex/center for potential widget content */}
                  <LazyWidget widget={widget} />
                </div>
              );
            }}
          </FixedSizeList>
        </div>
      )}
      {/* TODO: Implement performance optimization strategies for rendering large datasets (e.g., virtualization, data aggregation) */}
    </div>
  );
};
