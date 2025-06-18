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
import KpiWidget from './KpiWidget';
import TextWidget from './TextWidget'; // Import TextWidget
import ImageWidget from './ImageWidget'; // Import ImageWidget
import { FilterWidget } from './FilterWidget';
import { v4 as uuidv4 } from 'uuid'; // Using uuid for unique IDs
import { Responsive, WidthProvider, Layout } from 'react-grid-layout'; // Import react-grid-layout components
import 'react-grid-layout/css/styles.css'; // Import default styles
import 'react-resizable/css/styles.css'; // Import default styles

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
          type,
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
          type,
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
          type,
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
          type,
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
          type,
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
          type,
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
    });
    setWidgets(updatedWidgets);
  };

  const ResponsiveGridLayout = WidthProvider(Responsive);

  return (
    <div className="border p-4 rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Build Your Dashboard</h2>
      <div className="mb-4">
        <WidgetLibrary onSelectWidget={addWidget} />
      </div>
      {/*
        {/*
        TODO: Implement Enhanced Drag-and-Drop Interface:
        - Improve responsiveness and intuitiveness (react-grid-layout provides basic drag-and-drop,
          further enhancements might involve custom drag previews, snapping, etc.)
        - Smart Suggestions for chart types based on selected data (Requires data source integration and analysis)
        - Live Preview as users configure charts and tables (Requires data binding and rendering updates during configuration)
        - Layering and Grouping of data series and visualizations (Requires significant logic for managing widget relationships and rendering order)
      */}
      <ResponsiveGridLayout
        className="layout"
        // Add drag and drop specific props here for further customization
        onDragStop={(layout, oldItem, newItem, placeholder, e, element) => {
          console.log('Drag stopped:', { layout, oldItem, newItem });
          // Additional logic for snapping, custom previews, etc. can be added here
        }}
        onResizeStop={(layout, oldItem, newItem, placeholder, e, element) => {
          console.log('Resize stopped:', { layout, oldItem, newItem });
          // Additional logic for snapping, custom previews, etc. can be added here
        }}
        layouts={{ lg: initialGridLayout }} // Use initialGridLayout for the initial layout
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 2 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={30} // Example row height, adjust as needed
        onLayoutChange={onLayoutChange}
        // Provide a default layout if none is provided
        // This might be redundant with initialGridLayout but good for clarity
        // layout={initialGridLayout} // react-grid-layout manages internal state, no need for this prop after initial render
      >
        {widgets.map((widget) => (
          // react-grid-layout uses the 'key' prop for the item's ID
          <div key={widget.id} className="border p-4 rounded shadow">
            {renderWidget(widget)}
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
};
