'use client';
import React, { useState } from 'react';
import { WidgetLibrary } from './WidgetLibrary';
import {
  WidgetConfig,
  WIDGET_TYPES,
  ChartWidgetConfig,
  TableWidgetConfig,
  KpiWidgetConfig,
  TextWidgetConfig,
  ImageWidgetConfig,
  FilterWidgetConfig,
} from '../widget-types';
import { ChartWidget } from './ChartWidget';
import { TableWidget } from './TableWidget';
import KpiWidget from './KpiWidget';
import TextWidget from './TextWidget';
import ImageWidget from './ImageWidget';
import { FilterWidget } from './FilterWidget';
import { v4 as uuidv4 } from 'uuid';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface DashboardBuilderProps {
  initialWidgets?: WidgetConfig[];
  initialLayout?: Layout[] | null;
}

export const DashboardBuilder: React.FC<DashboardBuilderProps> = ({
  initialWidgets,
}) => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(initialWidgets || []);

  const addWidget = (type: string) => {
    let newWidget: WidgetConfig;
    const defaultX = (widgets.length * 2) % 12;
    const defaultY = Infinity;

    switch (type) {
      case WIDGET_TYPES.CHART: {
        newWidget = {
          id: uuidv4(),
          type,
          title: 'New Chart Widget',
          x: defaultX,
          y: defaultY,
          w: 6,
          h: 4,
          data: {
            labels: ['Jan', 'Feb', 'Mar'],
            datasets: [{ label: 'Sales', data: [100, 200, 150] }],
          },
          chartType: 'bar',
        } as ChartWidgetConfig;
        break;
      }
      case WIDGET_TYPES.GEOSPATIAL_MAP: {
        newWidget = {
          id: uuidv4(),
          type: WIDGET_TYPES.CHART,
          title: 'New Geospatial Map Widget',
          x: defaultX,
          y: defaultY,
          w: 6,
          h: 4,
          data: {
            labels: ['Location 1', 'Location 2'],
            datasets: [
              { label: 'Latitude', data: [37.7749, 34.0522] },
              { label: 'Longitude', data: [-122.4194, -118.2437] },
            ],
          },
          chartType: 'geospatial-map',
          initialPosition: [0, 0],
          initialZoom: 2,
        } as ChartWidgetConfig;
        break;
      }
      case WIDGET_TYPES.TABLE:
        newWidget = {
          id: uuidv4(),
          type,
          title: 'New Table Widget',
          x: defaultX,
          y: defaultY,
          w: 6,
          h: 4,
          data: {
            headers: ['Column 1', 'Column 2'],
            rows: [['Data 1', 'Data 2']],
          },
        } as TableWidgetConfig;
        break;
      case WIDGET_TYPES.KPI:
        newWidget = {
          id: uuidv4(),
          type,
          title: 'New KPI Widget',
          x: defaultX,
          y: defaultY,
          w: 3,
          h: 2,
          data: { value: 'N/A', label: 'Metric' },
        } as KpiWidgetConfig;
        break;
      case WIDGET_TYPES.TEXT:
        newWidget = {
          id: uuidv4(),
          type,
          title: 'New Text Widget',
          x: defaultX,
          y: defaultY,
          w: 4,
          h: 2,
          data: { content: 'Edit this text or use Markdown.' },
        } as TextWidgetConfig;
        break;
      case WIDGET_TYPES.IMAGE:
        newWidget = {
          id: uuidv4(),
          type,
          title: 'New Image Widget',
          x: defaultX,
          y: defaultY,
          w: 4,
          h: 3,
          data: { url: '', altText: '' },
        } as ImageWidgetConfig;
        break;
      case WIDGET_TYPES.FILTER:
        newWidget = {
          id: uuidv4(),
          type,
          title: 'New Filter Widget',
          x: defaultX,
          y: defaultY,
          w: 3,
          h: 2,
          data: {
            dataSourceId: '',
            field: '',
            filterType: 'dropdown',
            options: [],
          } as FilterWidgetConfig['data'],
        } as FilterWidgetConfig;
        break;
      default:
        console.error('Attempted to add unknown widget type:', type);
        return;
    }

    setWidgets((prevWidgets) => [...prevWidgets, newWidget]);
  };

  const renderWidget = (widget: WidgetConfig) => {
    switch (widget.type) {
      case WIDGET_TYPES.CHART:
        return <ChartWidget config={widget as ChartWidgetConfig} />;
      case WIDGET_TYPES.TABLE:
        return <TableWidget config={widget as TableWidgetConfig} />;
      case WIDGET_TYPES.KPI:
        return <KpiWidget config={widget as KpiWidgetConfig} />;
      case WIDGET_TYPES.TEXT:
        return (
          <TextWidget
            id={widget.id}
            content={(widget as TextWidgetConfig).data.content}
          />
        );
      case WIDGET_TYPES.IMAGE: {
        const imageWidget = widget as ImageWidgetConfig;
        return (
          <ImageWidget
            id={imageWidget.id}
            imageUrl={imageWidget.data.url}
            altText={imageWidget.data.altText}
          />
        );
      }
      case WIDGET_TYPES.FILTER: {
        const filterWidget = widget as FilterWidgetConfig;
        return (
          <FilterWidget
            config={filterWidget}
            onFilterChange={(filterValue) =>
              console.log('Filter value changed:', filterValue)
            }
          />
        );
      }
      default:
        return <div>Unknown Widget Type</div>;
    }
  };

  const onLayoutChange = (newLayout: Layout[]) => {
    setWidgets((prevWidgets) =>
      prevWidgets.map((widget) => {
        const layoutItem = newLayout.find(
          (item: Layout) => item.i === widget.id,
        );
        if (layoutItem) {
          return {
            ...widget,
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h,
          };
        }
        return widget;
      }),
    );
  };

  const ResponsiveGridLayout = WidthProvider(Responsive);

  return (
    <div className="border p-4 rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Build Your Dashboard</h2>
      <div className="mb-4">
        <WidgetLibrary onSelectWidget={addWidget} />
      </div>
      <ResponsiveGridLayout
        className="layout"
        onDragStop={(layout, oldItem, newItem, placeholder, e, element) => {
          console.log('Drag stopped:', { layout, oldItem, newItem });
        }}
        onResizeStop={(layout, oldItem, newItem, placeholder, e, element) => {
          console.log('Resize stopped:', { layout, oldItem, newItem });
        }}
        layouts={{
          lg: widgets.map((widget) => ({
            i: widget.id,
            x: widget.x,
            y: widget.y,
            w: widget.w,
            h: widget.h,
          })),
        }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 2 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={30}
        onLayoutChange={onLayoutChange}
      >
        {widgets.map((widget) => (
          <div key={widget.id} className="border p-4 rounded shadow">
            {renderWidget(widget)}
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
};
