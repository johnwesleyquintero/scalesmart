'use client';
import React, { useState } from 'react';
import { WidgetLibrary } from './WidgetLibrary';
import {
  WidgetConfig,
  WidgetType,
  WIDGET_TYPES,
  ChartWidgetConfig,
  TableWidgetConfig,
  KpiWidgetConfig,
  TextWidgetConfig,
  ImageWidgetConfig,
  FilterWidgetConfig, // Import FilterWidgetConfig
} from '../widget-types'; // Added TextWidgetConfig and ImageWidgetConfig
import { ChartWidget } from './ChartWidget';
import { TableWidget } from './TableWidget';
import { KpiWidget } from './KpiWidget';
import TextWidget from './TextWidget'; // Import TextWidget
import ImageWidget from './ImageWidget'; // Import ImageWidget
import { FilterWidget } from './FilterWidget';
import { v4 as uuidv4 } from 'uuid'; // Using uuid for unique IDs
import { Responsive, WidthProvider, Layout } from 'react-grid-layout'; // Import react-grid-layout components
import '/node_modules/react-grid-layout/css/styles.css'; // Import default styles
import '/node_modules/react-resizable/css/styles.css'; // Import default styles

interface DashboardBuilderProps {
  initialWidgets?: WidgetConfig[];
  initialLayout?: Layout[] | null; // Define a more specific type if available
}

export const DashboardBuilder: React.FC<DashboardBuilderProps> = ({
  initialWidgets,
  initialLayout,
}) => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(initialWidgets || []);
  // react-grid-layout uses its own internal layout state, but we can initialize it
  // and update our widget configs when the layout changes.
  // For initial load, we can derive the layout from initialWidgets if initialLayout is not provided.
  const initialGridLayout: Layout[] =
    initialLayout ||
    initialWidgets?.map((widget) => ({
      i: widget.id,
      x: widget.x,
      y: widget.y,
      w: widget.w,
      h: widget.h,
    })) ||
    [];

  // We don't need a separate state for layout in DashboardBuilder
  // react-grid-layout manages the layout internally, and we update
  // our widget state based on its onLayoutChange callback.

  const addWidget = (type: WidgetType) => {
    // Create a basic default config for the new widget
    let newWidget: WidgetConfig;

    // Provide basic default data based on widget type
    switch (type) {
      case WIDGET_TYPES.CHART:
        newWidget = {
          id: uuidv4(),
          type: WIDGET_TYPES.CHART,
          title: 'New Chart Widget',
          x: 0,
          y: 0,
          w: 6,
          h: 4,
          data: {
            labels: ['Jan', 'Feb', 'Mar'],
            datasets: [{ label: 'Sales', data: [100, 200, 150] }],
          },
          chartType: 'bar',
        } as ChartWidgetConfig;
        break;
      case WIDGET_TYPES.TABLE:
        newWidget = {
          id: uuidv4(),
          type: WIDGET_TYPES.TABLE,
          title: 'New Table Widget',
          x: 0,
          y: 0,
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
          type: WIDGET_TYPES.KPI,
          title: 'New KPI Widget',
          x: 0,
          y: 0,
          w: 3,
          h: 2,
          data: { value: 'N/A', label: 'Metric' },
        } as KpiWidgetConfig;
        break;
      case WIDGET_TYPES.TEXT: // Add default config for TextWidget
        newWidget = {
          id: uuidv4(),
          type: WIDGET_TYPES.TEXT,
          title: 'New Text Widget',
          x: 0,
          y: 0,
          w: 4,
          h: 2,
          data: { content: 'Edit this text or use Markdown.' },
        } as TextWidgetConfig;
        break;
      case WIDGET_TYPES.IMAGE: // Add default config for ImageWidget
        newWidget = {
          id: uuidv4(),
          type: WIDGET_TYPES.IMAGE,
          title: 'New Image Widget',
          x: 0,
          y: 0,
          w: 4,
          h: 3,
          data: { url: '', altText: '' }, // User will provide URL and alt text
        } as ImageWidgetConfig;
        break;
      case WIDGET_TYPES.FILTER:
        newWidget = {
          id: uuidv4(),
          type: WIDGET_TYPES.FILTER,
          title: 'New Filter Widget',
          x: 0,
          y: 0,
          w: 3,
          h: 2,
          data: {
            // Explicitly type the data object
            dataSourceId: '', // Default placeholder
            field: '', // Default placeholder
            filterType: 'dropdown', // Default type
            options: [], // Default empty options
          } as FilterWidgetConfig['data'],
        } as FilterWidgetConfig; // Assert the type
        break;
      default:
        console.error('Attempted to add unknown widget type:', type);
        return;
    }

    setWidgets([...widgets, newWidget]);
  };

  const renderWidget = (widget: WidgetConfig) => {
    switch (widget.type) {
      case WIDGET_TYPES.CHART:
        return <ChartWidget config={widget as ChartWidgetConfig} />;
      case WIDGET_TYPES.TABLE:
        return <TableWidget config={widget as TableWidgetConfig} />;
      case WIDGET_TYPES.KPI:
        return <KpiWidget config={widget as KpiWidgetConfig} />;
      case WIDGET_TYPES.TEXT: // Add case for TextWidget
        return (
          <TextWidget
            id={widget.id}
            content={(widget as TextWidgetConfig).data.content}
          />
        );
      case WIDGET_TYPES.IMAGE: {
        // Use block scope
        const imageWidget = widget as ImageWidgetConfig; // Explicit type assertion
        return (
          <ImageWidget
            id={imageWidget.id}
            imageUrl={imageWidget.data.url}
            altText={imageWidget.data.altText}
          />
        );
      } // Close block scope
      case WIDGET_TYPES.FILTER: {
        // Use block scope
        const filterWidget = widget as FilterWidgetConfig; // Explicit type assertion
        return (
          <FilterWidget
            config={filterWidget}
            onFilterChange={(filterValue) =>
              console.log('Filter value changed:', filterValue)
            } // Placeholder handler
          />
        );
      } // Close block scope
      default:
        return <div>Unknown Widget Type</div>;
    }
  };

  // Function to handle layout changes (drag, resize)
  const onLayoutChange = (layout: Layout[]) => {
    // Update widget positions and sizes based on the new layout
    const updatedWidgets = widgets.map((widget) => {
      const layoutItem = layout.find((item: Layout) => item.i === widget.id);
      if (!layoutItem) return widget; // Should not happen
      return {
        ...widget,
        x: layoutItem.x,
        y: layoutItem.y,
        w: layoutItem.w,
        h: layoutItem.h,
      };
    });
    setWidgets(updatedWidgets);
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter((widget) => widget.id !== id));
  };

  const ResponsiveGridLayout = WidthProvider(Responsive);

  return (
    <div className="dashboard-builder p-4">
      <h2 className="text-2xl font-bold mb-4">Dashboard Builder</h2>
      <WidgetLibrary onSelectWidget={addWidget} />
      <div className="mt-4 border p-4 rounded-lg bg-gray-50 min-h-[500px]">
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: initialGridLayout }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={30}
          onLayoutChange={onLayoutChange}
          draggableHandle=".drag-handle"
        >
          {widgets.map((widget) => (
            <div
              key={widget.id}
              data-grid={{ x: widget.x, y: widget.y, w: widget.w, h: widget.h }}
            >
              <div className="widget-container border rounded-lg shadow-md bg-white h-full flex flex-col">
                <div className="drag-handle bg-gray-200 p-2 cursor-grab flex justify-between items-center rounded-t-lg">
                  <span className="font-semibold">
                    {widget.title || 'Widget'}
                  </span>
                  <button
                    onClick={() => removeWidget(widget.id)}
                    className="text-red-500 hover:text-red-700 focus:outline-none"
                    aria-label="Remove widget"
                  >
                    &times;
                  </button>
                </div>
                <div className="flex-grow p-2 overflow-auto">
                  {renderWidget(widget)}
                </div>
              </div>
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
    </div>
  );
};
