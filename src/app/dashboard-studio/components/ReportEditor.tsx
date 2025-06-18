import React, { useState } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  WidgetConfig,
  WIDGET_TYPES,
  ChartWidgetConfig,
  TableWidgetConfig,
  KpiWidgetConfig,
  TextWidgetConfig,
  ImageWidgetConfig,
  FilterWidgetConfig,
  WidgetType, // Import WidgetType
} from '../widget-types';
import { ChartWidget } from './ChartWidget';
import { TableWidget } from './TableWidget';
import KpiWidget from './KpiWidget';
import TextWidget from './TextWidget';
import ImageWidget from './ImageWidget';
import { FilterWidget } from './FilterWidget';
import { v4 as uuidv4 } from 'uuid';
import { WidgetLibrary } from './WidgetLibrary'; // Import WidgetLibrary

// Define a type for Report Elements - reusing WidgetConfig for consistency
type ReportElementConfig = WidgetConfig;

export const ReportEditor = () => {
  const [reportTitle, setReportTitle] = useState('');
  // Keeping reportContent state for the main text area, separate from grid elements
  const [reportContent, setReportContent] = useState('');
  const [reportElements, setReportElements] = useState<ReportElementConfig[]>(
    [],
  );

  // Initial layout derived from reportElements
  const initialReportLayout: Layout[] = reportElements.map((element) => ({
    i: element.id,
    x: element.x,
    y: element.y,
    w: element.w,
    h: element.h,
  }));

  const handleSaveReport = () => {
    console.log('Saving Report:', {
      reportTitle,
      reportContent,
      reportElements,
    });
    alert('Report Saved (check console)');
  };

  // Function to render report elements (reusing widget rendering logic)
  const renderReportElement = (element: ReportElementConfig) => {
    switch (element.type) {
      case WIDGET_TYPES.CHART:
        return <ChartWidget config={element as ChartWidgetConfig} />;
      case WIDGET_TYPES.TABLE:
        return <TableWidget config={element as TableWidgetConfig} />;
      case WIDGET_TYPES.KPI:
        return <KpiWidget config={element as KpiWidgetConfig} />;
      case WIDGET_TYPES.TEXT:
        return (
          <TextWidget
            id={element.id}
            content={(element as TextWidgetConfig).data.content}
          />
        );
      case WIDGET_TYPES.IMAGE: {
        const imageElement = element as ImageWidgetConfig;
        return (
          <ImageWidget
            id={imageElement.id}
            imageUrl={imageElement.data.url}
            altText={imageElement.data.altText}
          />
        );
      }
      case WIDGET_TYPES.FILTER: {
        const filterElement = element as FilterWidgetConfig;
        return (
          <FilterWidget
            config={filterElement}
            onFilterChange={(filterValue) =>
              console.log('Filter value changed:', filterValue)
            }
          />
        );
      }
      default:
        return <div>Unknown Report Element Type</div>;
    }
  };

  // Function to handle layout changes (drag, resize)
  const onLayoutChange = (layout: Layout[]) => {
    const updatedElements = reportElements.map((element) => {
      const layoutItem = layout.find((item: Layout) => item.i === element.id);
      if (layoutItem) {
        return {
          ...element,
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h,
        };
      }
      return element;
    });
    setReportElements(updatedElements);
  };

  const addReportElement = (type: WidgetType) => {
    // Create a basic default config for the new report element
    let newElement: ReportElementConfig;

    // Provide basic default data based on element type (reusing widget types)
    switch (type) {
      case WIDGET_TYPES.CHART:
        newElement = {
          id: uuidv4(),
          type,
          title: 'New Chart Element',
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
        newElement = {
          id: uuidv4(),
          type,
          title: 'New Table Element',
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
        newElement = {
          id: uuidv4(),
          type,
          title: 'New KPI Element',
          x: 0,
          y: 0,
          w: 3,
          h: 2,
          data: { value: 'N/A', label: 'Metric' },
        } as KpiWidgetConfig;
        break;
      case WIDGET_TYPES.TEXT:
        newElement = {
          id: uuidv4(),
          type,
          title: 'New Text Element',
          x: 0,
          y: 0,
          w: 4,
          h: 2,
          data: { content: 'Edit this text or use Markdown.' },
        } as TextWidgetConfig;
        break;
      case WIDGET_TYPES.IMAGE:
        newElement = {
          id: uuidv4(),
          type,
          title: 'New Image Element',
          x: 0,
          y: 0,
          w: 4,
          h: 3,
          data: { url: '', altText: '' },
        } as ImageWidgetConfig;
        break;
      case WIDGET_TYPES.FILTER:
        newElement = {
          id: uuidv4(),
          type,
          title: 'New Filter Element',
          x: 0,
          y: 0,
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
        console.error('Attempted to add unknown report element type:', type);
        return;
    }

    setReportElements([...reportElements, newElement]);
  };

  const ResponsiveGridLayout = WidthProvider(Responsive);

  return (
    <div className="border p-4 rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Report Editor</h2>
      <div className="mb-4">
        <label
          htmlFor="reportTitle"
          className="block text-sm font-medium text-gray-700"
        >
          Report Title
        </label>
        <input
          type="text"
          id="reportTitle"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={reportTitle}
          onChange={(e) => setReportTitle(e.target.value)}
          placeholder="Enter report title"
        />
      </div>
      {/* Main Report Content Text Area */}
      <div className="mb-4">
        <label
          htmlFor="reportContent"
          className="block text-sm font-medium text-gray-700"
        >
          Report Content
        </label>
        <textarea
          id="reportContent"
          rows={10}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={reportContent}
          onChange={(e) => setReportContent(e.target.value)}
          placeholder="Write your report content here..."
        ></textarea>
      </div>

      {/* Drag-and-Drop Area for Report Elements */}
      <div className="mb-4">
        <h3 className="text-xl font-semibold mb-2">Report Elements</h3>
        <div className="mb-4">
          {/* Add a way to add new report elements (e.g., a library or buttons) */}
          <WidgetLibrary onSelectWidget={addReportElement} />
        </div>
        <div className="mb-4">
          {/* Add a way to add new report elements (e.g., a library or buttons) */}
          <WidgetLibrary onSelectWidget={addReportElement} />
        </div>
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: initialReportLayout }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 2 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={30}
          onLayoutChange={onLayoutChange}
        >
          {reportElements.map((element) => (
            <div key={element.id} className="border p-4 rounded shadow">
              {renderReportElement(element)}
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>

      <button
        onClick={handleSaveReport}
        className="bg-indigo-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Save Report
      </button>
    </div>
  );
};
