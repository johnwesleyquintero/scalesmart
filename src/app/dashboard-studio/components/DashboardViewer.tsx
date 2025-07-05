'use client';

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { FixedSizeList } from 'react-window';
import {
  ChartWidgetConfig,
  TableWidgetConfig,
  WidgetConfig,
} from '../widget-types';
import { DashboardService } from '@/lib/dashboard-service'; // Import DashboardService

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
const LazyWidget: React.FC<{ widget: WidgetConfig }> = ({ widget }) => {
  const WidgetComponent = widgetComponents[widget.type];

  if (!WidgetComponent) {
    return <p>Unknown widget type: {widget.type}</p>;
  }

  return (
    <Suspense fallback={<div>Loading widget...</div>}>
      <WidgetComponent config={widget} />
    </Suspense>
  );
};

interface DashboardViewerProps {
  dashboardId: string;
}

export const DashboardViewer: React.FC<DashboardViewerProps> = ({
  dashboardId,
}) => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetchWidgets = async () => {
      try {
        const fetchedWidgets =
          await DashboardService.getDashboardWidgets(dashboardId);
        setWidgets(fetchedWidgets);
      } catch (error) {
        console.error('Failed to fetch dashboard widgets:', error);
        setWidgets([]); // Set to empty on error
      } finally {
        setLoading(false);
      }
    };

    fetchWidgets();
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
    </div>
  );
};
